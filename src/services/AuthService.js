const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Session = require('../models/Session');
const logger = require('../utils/logger');
const helpers = require('../utils/helpers');

// Serviço de autenticação
class AuthService {
  // Registrar novo usuário
  async registerUser(userData) {
    try {
      // Verificar se o usuário já existe
      const existingUser = await User.findOne({ 
        $or: [
          { username: userData.username },
          { email: userData.email }
        ]
      });
      
      if (existingUser) {
        throw new Error('Usuário ou email já cadastrado');
      }
      
      // Criar novo usuário
      const user = new User(userData);
      await user.save();
      
      // Gerar token JWT
      const token = helpers.generateToken(user._id);
      
      return {
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      logger.error(`Erro ao registrar usuário: ${error.message}`);
      throw error;
    }
  }
  
  // Login de usuário
  async loginUser(email, password) {
    try {
      // Buscar usuário pelo email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Credenciais inválidas');
      }
      
      // Verificar se o usuário está ativo
      if (!user.active) {
        throw new Error('Conta de usuário desativada');
      }
      
      // Verificar senha
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Credenciais inválidas');
      }
      
      // Atualizar último login
      user.lastLogin = Date.now();
      await user.save();
      
      // Gerar token JWT
      const token = helpers.generateToken(user._id);
      
      return {
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      logger.error(`Erro ao fazer login: ${error.message}`);
      throw error;
    }
  }
  
  // Obter informações do usuário atual
  async getCurrentUser(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Buscar sessões do usuário
      const sessions = await Session.find({ user: userId });
      
      return {
        success: true,
        user: {
          ...user.toObject(),
          sessionCount: sessions.length
        }
      };
    } catch (error) {
      logger.error(`Erro ao obter usuário atual: ${error.message}`);
      throw error;
    }
  }
  
  // Atualizar informações do usuário
  async updateUser(userId, userData) {
    try {
      // Não permitir atualização de email ou username para valores já existentes
      if (userData.email || userData.username) {
        const existingUser = await User.findOne({
          _id: { $ne: userId },
          $or: [
            { username: userData.username },
            { email: userData.email }
          ]
        });
        
        if (existingUser) {
          throw new Error('Username ou email já em uso');
        }
      }
      
      // Se houver nova senha, fazer hash
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      // Atualizar usuário
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: userData },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      return {
        success: true,
        user
      };
    } catch (error) {
      logger.error(`Erro ao atualizar usuário: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AuthService();
