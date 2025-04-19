const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Session = require('../models/Session');
const User = require('../models/User');
const logger = require('../utils/logger');
const eventService = require('./EventEmitter');

class WhatsAppAuth {
  constructor() {
    this.sessionsPath = path.join(process.cwd(), 'sessions');
    
    // Criar diretório de sessões se não existir
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
  }
  
  // Iniciar processo de autenticação para uma sessão
  async startAuth(sessionId, userId, sessionName) {
    try {
      // Verificar se a sessão já existe
      let session = await Session.findOne({ sessionId });
      
      if (!session) {
        // Criar nova sessão no banco de dados
        session = new Session({
          sessionId,
          user: userId,
          name: sessionName,
          isActive: false,
          createdAt: Date.now()
        });
        
        await session.save();
        
        // Adicionar sessão ao usuário
        await User.findByIdAndUpdate(userId, {
          $addToSet: { sessions: session._id }
        });
      }
      
      // Criar diretório para a sessão
      const sessionDir = path.join(this.sessionsPath, sessionId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      
      // Carregar estado de autenticação
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      // Criar socket WhatsApp
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: logger,
        browser: ['WhatsApp Multi-User', 'Chrome', '1.0.0'],
        getMessage: async (key) => {
          // Implementação básica - em produção, buscar do banco de dados
          return {
            conversation: 'Mensagem não encontrada'
          };
        }
      });
      
      // Manipular eventos de conexão
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Atualizar estado da sessão
        if (connection) {
          await Session.findOneAndUpdate(
            { sessionId },
            { 
              lastConnection: Date.now(),
              isActive: connection === 'open'
            }
          );
          
          // Emitir evento de atualização de conexão
          eventService.emitSessionEvent(sessionId, 'connection', {
            status: connection,
            timestamp: Date.now()
          });
        }
        
        // Processar código QR
        if (qr) {
          try {
            // Gerar QR code como string base64
            const qrImage = await qrcode.toDataURL(qr);
            
            // Salvar QR code na sessão
            await Session.findOneAndUpdate(
              { sessionId },
              { qrCode: qrImage }
            );
            
            // Emitir evento de QR code
            eventService.emitSessionEvent(sessionId, 'qr', {
              qrCode: qrImage,
              timestamp: Date.now()
            });
          } catch (err) {
            logger.error(`Erro ao gerar QR code: ${err.message}`);
          }
        }
        
        // Lidar com desconexão
        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          
          logger.info(`Conexão fechada para sessão ${sessionId}. Reconectar: ${shouldReconnect}`);
          
          if (shouldReconnect) {
            // Tentar reconectar
            setTimeout(() => {
              this.startAuth(sessionId, userId, sessionName);
            }, 5000);
          } else {
            // Usuário deslogado, atualizar estado da sessão
            await Session.findOneAndUpdate(
              { sessionId },
              { 
                isActive: false,
                qrCode: null
              }
            );
            
            // Emitir evento de logout
            eventService.emitSessionEvent(sessionId, 'logout', {
              timestamp: Date.now()
            });
          }
        }
        
        // Conexão estabelecida com sucesso
        if (connection === 'open') {
          logger.info(`Conexão estabelecida para sessão ${sessionId}`);
          
          // Salvar credenciais
          await saveCreds();
          
          // Obter informações do telefone
          const phoneNumber = sock.user?.id?.split(':')[0];
          
          // Atualizar sessão com informações do telefone
          await Session.findOneAndUpdate(
            { sessionId },
            { 
              phoneNumber,
              isActive: true,
              qrCode: null,
              lastConnection: Date.now()
            }
          );
          
          // Emitir evento de autenticação bem-sucedida
          eventService.emitSessionEvent(sessionId, 'authenticated', {
            phoneNumber,
            timestamp: Date.now()
          });
        }
      });
      
      // Salvar credenciais quando houver atualizações
      sock.ev.on('creds.update', saveCreds);
      
      return {
        success: true,
        session
      };
    } catch (error) {
      logger.error(`Erro ao iniciar autenticação: ${error.message}`);
      throw error;
    }
  }
  
  // Verificar estado de autenticação de uma sessão
  async checkAuthStatus(sessionId) {
    try {
      const session = await Session.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      return {
        success: true,
        isActive: session.isActive,
        qrCode: session.qrCode,
        phoneNumber: session.phoneNumber,
        lastConnection: session.lastConnection
      };
    } catch (error) {
      logger.error(`Erro ao verificar estado de autenticação: ${error.message}`);
      throw error;
    }
  }
  
  // Logout de uma sessão
  async logout(sessionId) {
    try {
      const session = await Session.findOne({ sessionId });
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Atualizar estado da sessão
      await Session.findOneAndUpdate(
        { sessionId },
        { 
          isActive: false,
          qrCode: null
        }
      );
      
      // Remover arquivos de autenticação
      const sessionDir = path.join(this.sessionsPath, sessionId);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
      
      // Emitir evento de logout
      eventService.emitSessionEvent(sessionId, 'logout', {
        timestamp: Date.now()
      });
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    } catch (error) {
      logger.error(`Erro ao fazer logout: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WhatsAppAuth();
