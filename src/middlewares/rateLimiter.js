const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Middleware para limitar requisições por IP
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições deste IP, tente novamente após 15 minutos',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    res.status(options.statusCode).json({
      success: false,
      message: options.message
    });
  }
});

// Middleware para limitar requisições específicas para API de mensagens
const messageRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // limite de 30 requisições por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Muitas requisições de envio de mensagens, tente novamente após 1 minuto',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit de mensagens excedido para IP: ${req.ip}`);
    res.status(options.statusCode).json({
      success: false,
      message: options.message
    });
  }
});

module.exports = {
  rateLimiter,
  messageRateLimiter
};
