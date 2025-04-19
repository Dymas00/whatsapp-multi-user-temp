const express = require('express');
const router = express.Router();
const SessionManager = require('../services/SessionManager');
const WhatsAppAuth = require('../services/WhatsAppAuth');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Rota para listar sessões
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    // Usuários normais só veem suas próprias sessões, admins veem todas
    const userId = req.user.role === 'admin' ? null : req.user._id;
    const result = await SessionManager.listSessions(userId);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao listar sessões: ${error.message}`);
    next(error);
  }
});

// Rota para criar nova sessão
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nome da sessão é obrigatório'
      });
    }
    
    const result = await SessionManager.createSession(req.user._id, name);
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Erro ao criar sessão: ${error.message}`);
    next(error);
  }
});

// Rota para obter detalhes de uma sessão
router.get('/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await SessionManager.getSessionStatus(sessionId);
    
    // Verificar se o usuário tem permissão para acessar esta sessão
    if (req.user.role !== 'admin' && result.session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar esta sessão'
      });
    }
    
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao obter detalhes da sessão: ${error.message}`);
    next(error);
  }
});

// Rota para iniciar uma sessão
router.post('/:sessionId/start', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Verificar se o usuário tem permissão para iniciar esta sessão
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    if (req.user.role !== 'admin' && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para iniciar esta sessão'
      });
    }
    
    const result = await SessionManager.startSession(sessionId);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao iniciar sessão: ${error.message}`);
    next(error);
  }
});

// Rota para parar uma sessão
router.post('/:sessionId/stop', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Verificar se o usuário tem permissão para parar esta sessão
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    if (req.user.role !== 'admin' && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para parar esta sessão'
      });
    }
    
    const result = await SessionManager.stopSession(sessionId);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao parar sessão: ${error.message}`);
    next(error);
  }
});

// Rota para excluir uma sessão
router.delete('/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Verificar se o usuário tem permissão para excluir esta sessão
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    if (req.user.role !== 'admin' && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para excluir esta sessão'
      });
    }
    
    const result = await SessionManager.deleteSession(sessionId);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao excluir sessão: ${error.message}`);
    next(error);
  }
});

// Rota para obter QR code de uma sessão
router.get('/:sessionId/qrcode', authMiddleware, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    // Verificar se o usuário tem permissão para acessar esta sessão
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Sessão não encontrada'
      });
    }
    
    if (req.user.role !== 'admin' && session.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Você não tem permissão para acessar esta sessão'
      });
    }
    
    const authStatus = await WhatsAppAuth.checkAuthStatus(sessionId);
    
    if (!authStatus.qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code não disponível'
      });
    }
    
    res.json({
      success: true,
      qrCode: authStatus.qrCode
    });
  } catch (error) {
    logger.error(`Erro ao obter QR code: ${error.message}`);
    next(error);
  }
});

module.exports = router;
