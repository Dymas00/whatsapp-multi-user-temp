const express = require('express');
const router = express.Router();
const MessageHandler = require('../services/MessageHandler');
const { authMiddleware } = require('../middlewares/auth');
const { messageRateLimiter } = require('../middlewares/rateLimiter');
const Session = require('../models/Session');
const logger = require('../utils/logger');

// Middleware para verificar permissão de acesso à sessão
const checkSessionPermission = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Buscar sessão
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    // Verificar permissão
    if (req.user.role !== 'admin' && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar esta sessão'
      });
    }
    
    // Adicionar sessão à requisição
    req.session = session;
    next();
  } catch (error) {
    logger.error(`Erro ao verificar permissão de sessão: ${error.message}`);
    next(error);
  }
};

// Rota para enviar mensagem de texto
router.post('/:sessionId/send', [authMiddleware, checkSessionPermission, messageRateLimiter], async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { jid, text } = req.body;
    
    // Validar dados de entrada
    if (!jid || !text) {
      return res.status(400).json({
        success: false,
        message: 'JID e texto são obrigatórios'
      });
    }
    
    // Enviar mensagem
    const result = await MessageHandler.sendTextMessage(sessionId, jid, text);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao enviar mensagem: ${error.message}`);
    next(error);
  }
});

// Rota para buscar histórico de mensagens
router.get('/:sessionId/history/:jid', [authMiddleware, checkSessionPermission], async (req, res, next) => {
  try {
    const { sessionId, jid } = req.params;
    const { limit, before } = req.query;
    
    // Buscar histórico
    const result = await MessageHandler.getMessageHistory(
      sessionId, 
      jid, 
      limit ? parseInt(limit) : 50,
      before ? parseInt(before) : null
    );
    
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao buscar histórico de mensagens: ${error.message}`);
    next(error);
  }
});

// Rota para buscar contatos
router.get('/:sessionId/contacts', [authMiddleware, checkSessionPermission], async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Buscar contatos
    const result = await MessageHandler.getContacts(sessionId);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao buscar contatos: ${error.message}`);
    next(error);
  }
});

module.exports = router;
