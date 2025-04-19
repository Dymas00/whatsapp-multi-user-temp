const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware de autenticação para proteger rotas
const authMiddleware = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso não autorizado. Token não fornecido.' 
      });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];
    
    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar o usuário pelo ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não encontrado ou token inválido.' 
      });
    }
    
    // Verificar se o usuário está ativo
    if (!user.active) {
      return res.status(403).json({ 
        success: false, 
        message: 'Conta de usuário desativada.' 
      });
    }
    
    // Adicionar o usuário ao objeto de requisição
    req.user = user;
    
    // Prosseguir para o próximo middleware ou controlador
    next();
  } catch (error) {
    logger.error(`Erro de autenticação: ${error.message}`);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado. Faça login novamente.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor durante autenticação.' 
    });
  }
};

// Middleware para verificar permissões de administrador
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Permissões de administrador necessárias.' 
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
