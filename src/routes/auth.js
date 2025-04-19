const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const { authMiddleware } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Rota para registro de usuário
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Validar dados de entrada
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }
    
    // Registrar usuário
    const result = await AuthService.registerUser({
      username,
      email,
      password
    });
    
    res.status(201).json(result);
  } catch (error) {
    logger.error(`Erro no registro: ${error.message}`);
    next(error);
  }
});

// Rota para login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validar dados de entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // Fazer login
    const result = await AuthService.loginUser(email, password);
    
    res.json(result);
  } catch (error) {
    logger.error(`Erro no login: ${error.message}`);
    
    // Erro específico para credenciais inválidas
    if (error.message === 'Credenciais inválidas') {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    next(error);
  }
});

// Rota para obter usuário atual
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const result = await AuthService.getCurrentUser(req.user._id);
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao obter usuário atual: ${error.message}`);
    next(error);
  }
});

// Rota para atualizar usuário
router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    // Atualizar usuário
    const result = await AuthService.updateUser(req.user._id, {
      username,
      email,
      password
    });
    
    res.json(result);
  } catch (error) {
    logger.error(`Erro ao atualizar usuário: ${error.message}`);
    next(error);
  }
});

module.exports = router;
