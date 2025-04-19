const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente
dotenv.config();

// Funções auxiliares para autenticação
const helpers = {
  // Gerar token JWT
  generateToken: (userId) => {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );
  },
  
  // Verificar token JWT
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  },
  
  // Extrair JID do número de telefone
  getJidFromPhoneNumber: (phoneNumber) => {
    // Remove caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return `${cleanNumber}@s.whatsapp.net`;
  },
  
  // Extrair número de telefone do JID
  getPhoneNumberFromJid: (jid) => {
    if (!jid) return null;
    return jid.split('@')[0];
  },
  
  // Verificar se é um JID de grupo
  isGroupJid: (jid) => {
    if (!jid) return false;
    return jid.endsWith('@g.us');
  },
  
  // Formatar mensagem para armazenamento
  formatMessage: (msg) => {
    let type = 'unknown';
    let content = null;
    let mediaUrl = null;
    
    // Determinar o tipo de mensagem e extrair conteúdo
    if (msg.message) {
      if (msg.message.conversation) {
        type = 'text';
        content = msg.message.conversation;
      } else if (msg.message.imageMessage) {
        type = 'image';
        content = msg.message.imageMessage.caption || '';
        mediaUrl = msg.message.imageMessage.url;
      } else if (msg.message.videoMessage) {
        type = 'video';
        content = msg.message.videoMessage.caption || '';
        mediaUrl = msg.message.videoMessage.url;
      } else if (msg.message.audioMessage) {
        type = 'audio';
        mediaUrl = msg.message.audioMessage.url;
      } else if (msg.message.documentMessage) {
        type = 'document';
        content = msg.message.documentMessage.fileName || '';
        mediaUrl = msg.message.documentMessage.url;
      } else if (msg.message.stickerMessage) {
        type = 'sticker';
        mediaUrl = msg.message.stickerMessage.url;
      } else if (msg.message.locationMessage) {
        type = 'location';
        content = `Latitude: ${msg.message.locationMessage.degreesLatitude}, Longitude: ${msg.message.locationMessage.degreesLongitude}`;
      } else if (msg.message.contactMessage || msg.message.contactsArrayMessage) {
        type = 'contact';
        content = 'Contato compartilhado';
      }
    }
    
    return {
      type,
      content,
      mediaUrl
    };
  }
};

module.exports = helpers;
