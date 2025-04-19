const logger = require('../utils/logger');

// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
  // Registrar o erro no log
  logger.error(`Erro: ${err.message}`);
  logger.error(err.stack);
  
  // Verificar o tipo de erro para retornar a resposta apropriada
  if (err.name === 'ValidationError') {
    // Erro de validação do Mongoose
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: Object.values(err.errors).map(val => val.message)
    });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    // Erro de duplicidade (violação de índice único)
    return res.status(400).json({
      success: false,
      message: 'Dados duplicados. Este registro já existe.'
    });
  }
  
  if (err.name === 'CastError') {
    // Erro de conversão de tipo (ex: ID inválido)
    return res.status(400).json({
      success: false,
      message: 'Formato de dados inválido'
    });
  }
  
  // Erro padrão para outros casos
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor'
  });
};

// Middleware para tratar rotas não encontradas
const notFoundHandler = (req, res, next) => {
  logger.warn(`Rota não encontrada: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Recurso não encontrado'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
