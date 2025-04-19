const { default: makeWASocket, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Contact = require('../models/Contact');
const logger = require('../utils/logger');
const eventService = require('./EventEmitter');
const helpers = require('../utils/helpers');
const WhatsAppAuth = require('./WhatsAppAuth');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionsPath = path.join(process.cwd(), 'sessions');
    this.maxSessions = process.env.MAX_SESSIONS || 10;
    
    // Criar diretório de sessões se não existir
    if (!fs.existsSync(this.sessionsPath)) {
      fs.mkdirSync(this.sessionsPath, { recursive: true });
    }
    
    logger.info(`Gerenciador de sessões inicializado. Máximo de sessões: ${this.maxSessions}`);
  }
  
  // Iniciar uma sessão existente
  async startSession(sessionId) {
    try {
      // Verificar se já atingiu o limite de sessões
      if (this.sessions.size >= this.maxSessions) {
        throw new Error(`Limite de ${this.maxSessions} sessões atingido`);
      }
      
      // Verificar se a sessão já está em execução
      if (this.sessions.has(sessionId)) {
        return {
          success: true,
          message: 'Sessão já está em execução',
          session: await Session.findOne({ sessionId })
        };
      }
      
      // Buscar sessão no banco de dados
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Iniciar autenticação
      await WhatsAppAuth.startAuth(sessionId, session.user, session.name);
      
      // Aguardar um momento para a autenticação iniciar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar estado da autenticação
      const authStatus = await WhatsAppAuth.checkAuthStatus(sessionId);
      
      return {
        success: true,
        message: 'Sessão iniciada com sucesso',
        session,
        authStatus
      };
    } catch (error) {
      logger.error(`Erro ao iniciar sessão: ${error.message}`);
      throw error;
    }
  }
  
  // Parar uma sessão
  async stopSession(sessionId) {
    try {
      // Verificar se a sessão existe
      if (!this.sessions.has(sessionId)) {
        return {
          success: false,
          message: 'Sessão não está em execução'
        };
      }
      
      // Fazer logout da sessão
      await WhatsAppAuth.logout(sessionId);
      
      // Remover sessão do mapa
      this.sessions.delete(sessionId);
      
      return {
        success: true,
        message: 'Sessão parada com sucesso'
      };
    } catch (error) {
      logger.error(`Erro ao parar sessão: ${error.message}`);
      throw error;
    }
  }
  
  // Listar todas as sessões
  async listSessions(userId = null) {
    try {
      let query = {};
      
      // Se userId for fornecido, filtrar por usuário
      if (userId) {
        query.user = userId;
      }
      
      // Buscar sessões no banco de dados
      const sessions = await Session.find(query).populate('user', 'username email');
      
      return {
        success: true,
        sessions,
        activeCount: this.sessions.size,
        maxSessions: this.maxSessions
      };
    } catch (error) {
      logger.error(`Erro ao listar sessões: ${error.message}`);
      throw error;
    }
  }
  
  // Verificar estado de uma sessão
  async getSessionStatus(sessionId) {
    try {
      // Buscar sessão no banco de dados
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Verificar estado da autenticação
      const authStatus = await WhatsAppAuth.checkAuthStatus(sessionId);
      
      return {
        success: true,
        session,
        isRunning: this.sessions.has(sessionId),
        authStatus
      };
    } catch (error) {
      logger.error(`Erro ao verificar estado da sessão: ${error.message}`);
      throw error;
    }
  }
  
  // Criar uma nova sessão
  async createSession(userId, sessionName) {
    try {
      // Verificar se já atingiu o limite de sessões para o usuário
      const userSessions = await Session.countDocuments({ user: userId });
      if (userSessions >= 3) { // Limite de 3 sessões por usuário
        throw new Error('Limite de sessões por usuário atingido');
      }
      
      // Gerar ID único para a sessão
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Criar sessão no banco de dados
      const session = new Session({
        sessionId,
        user: userId,
        name: sessionName,
        isActive: false,
        createdAt: Date.now()
      });
      
      await session.save();
      
      logger.info(`Nova sessão criada: ${sessionId} para usuário ${userId}`);
      
      return {
        success: true,
        message: 'Sessão criada com sucesso',
        session
      };
    } catch (error) {
      logger.error(`Erro ao criar sessão: ${error.message}`);
      throw error;
    }
  }
  
  // Excluir uma sessão
  async deleteSession(sessionId) {
    try {
      // Verificar se a sessão está em execução
      if (this.sessions.has(sessionId)) {
        // Parar a sessão primeiro
        await this.stopSession(sessionId);
      }
      
      // Buscar sessão no banco de dados
      const session = await Session.findOne({ sessionId });
      if (!session) {
        throw new Error('Sessão não encontrada');
      }
      
      // Remover referência da sessão no usuário
      await User.findByIdAndUpdate(session.user, {
        $pull: { sessions: session._id }
      });
      
      // Excluir mensagens da sessão
      await Message.deleteMany({ session: session._id });
      
      // Excluir contatos da sessão
      await Contact.deleteMany({ session: session._id });
      
      // Excluir sessão do banco de dados
      await Session.findByIdAndDelete(session._id);
      
      // Remover arquivos da sessão
      const sessionDir = path.join(this.sessionsPath, sessionId);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
      
      logger.info(`Sessão excluída: ${sessionId}`);
      
      return {
        success: true,
        message: 'Sessão excluída com sucesso'
      };
    } catch (error) {
      logger.error(`Erro ao excluir sessão: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new SessionManager();
