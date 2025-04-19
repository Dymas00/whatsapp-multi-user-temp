const { default: makeWASocket } = require('@whiskeysockets/baileys');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Session = require('../models/Session');
const logger = require('../utils/logger');
const eventService = require('./EventEmitter');
const helpers = require('../utils/helpers');

class MessageHandler {
  constructor() {
    this.sockets = new Map();
    logger.info('Manipulador de mensagens inicializado');
  }
  
  // Registrar socket para uma sessão
  registerSocket(sessionId, socket) {
    this.sockets.set(sessionId, socket);
    this.setupMessageListeners(sessionId, socket);
    logger.info(`Socket registrado para sessão ${sessionId}`);
  }
  
  // Configurar listeners de mensagens
  setupMessageListeners(sessionId, sock) {
    // Listener para novas mensagens
    sock.ev.on('messages.upsert', async (m) => {
      try {
        if (m.type !== 'notify') return;
        
        logger.debug(`Nova mensagem recebida na sessão ${sessionId}`);
        
        // Processar cada mensagem
        for (const msg of m.messages) {
          await this.processIncomingMessage(sessionId, msg);
        }
      } catch (error) {
        logger.error(`Erro ao processar mensagens: ${error.message}`);
      }
    });
    
    // Listener para atualizações de status de mensagens
    sock.ev.on('messages.update', async (updates) => {
      try {
        for (const update of updates) {
          // Atualizar status da mensagem no banco de dados
          if (update.key && update.update) {
            const messageId = update.key.id;
            
            // Mapear status do WhatsApp para nosso modelo
            let status = 'sent';
            if (update.update.status === 2) status = 'delivered';
            if (update.update.status === 3) status = 'read';
            
            // Atualizar no banco de dados
            await Message.findOneAndUpdate(
              { messageId },
              { status }
            );
            
            // Emitir evento de atualização de status
            eventService.emitMessageEvent(sessionId, 'status', {
              messageId,
              status,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        logger.error(`Erro ao processar atualizações de mensagens: ${error.message}`);
      }
    });
    
    // Listener para contatos
    sock.ev.on('contacts.update', async (updates) => {
      try {
        const session = await Session.findOne({ sessionId });
        
        for (const update of updates) {
          // Atualizar ou criar contato
          if (update.id) {
            const jid = update.id;
            
            // Verificar se o contato já existe
            let contact = await Contact.findOne({ session: session._id, jid });
            
            if (contact) {
              // Atualizar contato existente
              contact.name = update.name || contact.name;
              contact.pushName = update.pushName || contact.pushName;
              contact.status = update.status || contact.status;
              contact.updatedAt = Date.now();
              await contact.save();
            } else {
              // Criar novo contato
              contact = new Contact({
                session: session._id,
                jid,
                name: update.name,
                pushName: update.pushName,
                phoneNumber: helpers.getPhoneNumberFromJid(jid),
                isGroup: helpers.isGroupJid(jid),
                status: update.status,
                createdAt: Date.now()
              });
              await contact.save();
            }
            
            // Emitir evento de atualização de contato
            eventService.emitContactEvent(sessionId, 'update', {
              jid,
              name: contact.name,
              pushName: contact.pushName,
              timestamp: Date.now()
            });
          }
        }
      } catch (error) {
        logger.error(`Erro ao processar atualizações de contatos: ${error.message}`);
      }
    });
  }
  
  // Processar mensagem recebida
  async processIncomingMessage(sessionId, msg) {
    try {
      // Verificar se a mensagem já existe
      const existingMessage = await Message.findOne({ messageId: msg.key.id });
      if (existingMessage) return;
      
      // Buscar sessão
      const session = await Session.findOne({ sessionId });
      if (!session) {
        logger.error(`Sessão ${sessionId} não encontrada`);
        return;
      }
      
      // Extrair informações da mensagem
      const { type, content, mediaUrl } = helpers.formatMessage(msg);
      
      // Criar nova mensagem no banco de dados
      const newMessage = new Message({
        session: session._id,
        messageId: msg.key.id,
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        participant: msg.key.participant,
        pushName: msg.pushName,
        timestamp: msg.messageTimestamp * 1000,
        message: msg.message,
        status: msg.key.fromMe ? 'sent' : 'received',
        type,
        content,
        mediaUrl
      });
      
      await newMessage.save();
      
      // Emitir evento de nova mensagem
      eventService.emitMessageEvent(sessionId, 'new', {
        messageId: msg.key.id,
        remoteJid: msg.key.remoteJid,
        fromMe: msg.key.fromMe,
        type,
        content,
        timestamp: msg.messageTimestamp * 1000
      });
      
      // Atualizar ou criar contato
      if (msg.key.remoteJid) {
        const jid = msg.key.remoteJid;
        
        // Verificar se o contato já existe
        let contact = await Contact.findOne({ session: session._id, jid });
        
        if (!contact) {
          // Criar novo contato
          contact = new Contact({
            session: session._id,
            jid,
            pushName: msg.pushName,
            phoneNumber: helpers.getPhoneNumberFromJid(jid),
            isGroup: helpers.isGroupJid(jid),
            lastInteraction: Date.now()
          });
          await contact.save();
        } else {
          // Atualizar último contato
          contact.lastInteraction = Date.now();
          if (msg.pushName && !contact.pushName) {
            contact.pushName = msg.pushName;
          }
          await contact.save();
        }
      }
    } catch (error) {
      logger.error(`Erro ao processar mensagem recebida: ${error.message}`);
    }
  }
  
  // Enviar mensagem de texto
  async sendTextMessage(sessionId, jid, text) {
    try {
      // Verificar se o socket existe
      const sock = this.sockets.get(sessionId);
      if (!sock) {
        throw new Error('Sessão não está conectada');
      }
      
      // Buscar sessão
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Enviar mensagem
      const result = await sock.sendMessage(jid, { text });
      
      // Criar mensagem no banco de dados
      const newMessage = new Message({
        session: session._id,
        messageId: result.key.id,
        remoteJid: jid,
        fromMe: true,
        timestamp: Date.now(),
        message: { conversation: text },
        status: 'pending',
        type: 'text',
        content: text
      });
      
      await newMessage.save();
      
      // Atualizar último contato
      await Contact.findOneAndUpdate(
        { session: session._id, jid },
        { lastInteraction: Date.now() }
      );
      
      return {
        success: true,
        messageId: result.key.id,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Erro ao enviar mensagem: ${error.message}`);
      throw error;
    }
  }
  
  // Buscar histórico de mensagens
  async getMessageHistory(sessionId, jid, limit = 50, before = null) {
    try {
      // Buscar sessão
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Construir query
      const query = {
        session: session._id,
        remoteJid: jid
      };
      
      // Se before for fornecido, buscar mensagens anteriores a ele
      if (before) {
        query.timestamp = { $lt: before };
      }
      
      // Buscar mensagens
      const messages = await Message.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
      
      return {
        success: true,
        messages: messages.reverse()
      };
    } catch (error) {
      logger.error(`Erro ao buscar histórico de mensagens: ${error.message}`);
      throw error;
    }
  }
  
  // Buscar contatos
  async getContacts(sessionId) {
    try {
      // Buscar sessão
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Buscar contatos
      const contacts = await Contact.find({ session: session._id })
        .sort({ lastInteraction: -1 });
      
      return {
        success: true,
        contacts
      };
    } catch (error) {
      logger.error(`Erro ao buscar contatos: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new MessageHandler();
