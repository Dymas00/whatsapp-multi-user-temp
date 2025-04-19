const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const configureApp = require('./config/app');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const eventService = require('./services/EventEmitter');

// Importar rotas
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');

// Inicializar aplicação Express
const app = configureApp();

// Configurar rotas
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);

// Rota de verificação de saúde
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Manipulador para rotas não encontradas
app.use(notFoundHandler);

// Manipulador de erros
app.use(errorHandler);

// Criar servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware de autenticação para Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Autenticação necessária'));
  }
  
  // Verificar token (simplificado - em produção, usar JWT)
  try {
    const decoded = require('./utils/helpers').verifyToken(token);
    if (!decoded) {
      return next(new Error('Token inválido'));
    }
    
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error('Erro de autenticação'));
  }
});

// Manipular conexões Socket.IO
io.on('connection', (socket) => {
  logger.info(`Nova conexão Socket.IO: ${socket.id}`);
  
  // Registrar em salas específicas para o usuário
  socket.join(`user:${socket.user.id}`);
  
  // Manipular inscrição em eventos de sessão
  socket.on('subscribe:session', (sessionId) => {
    // Verificar permissão (simplificado)
    socket.join(`session:${sessionId}`);
    logger.debug(`Socket ${socket.id} inscrito na sessão ${sessionId}`);
  });
  
  // Manipular cancelamento de inscrição em eventos de sessão
  socket.on('unsubscribe:session', (sessionId) => {
    socket.leave(`session:${sessionId}`);
    logger.debug(`Socket ${socket.id} cancelou inscrição na sessão ${sessionId}`);
  });
  
  // Manipular desconexão
  socket.on('disconnect', () => {
    logger.info(`Socket.IO desconectado: ${socket.id}`);
  });
});

// Encaminhar eventos do EventEmitter para Socket.IO
eventService.on('message:any', (data) => {
  io.to(`session:${data.sessionId}`).emit('message', data);
});

eventService.on('session:any', (data) => {
  io.to(`session:${data.sessionId}`).emit('session', data);
});

eventService.on('contact:any', (data) => {
  io.to(`session:${data.sessionId}`).emit('contact', data);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;

// Conectar ao banco de dados e iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDB();
    
    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    logger.error(`Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  }
};

startServer();
