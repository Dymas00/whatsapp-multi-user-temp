const { EventEmitter } = require('events');
const logger = require('../utils/logger');

class EventService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20); // Aumenta o limite de listeners para suportar múltiplas sessões
    logger.info('Serviço de eventos inicializado');
  }
  
  // Método para emitir eventos relacionados a mensagens
  emitMessageEvent(sessionId, eventType, data) {
    const eventName = `message:${eventType}:${sessionId}`;
    this.emit(eventName, data);
    this.emit('message:any', { sessionId, eventType, data });
    logger.debug(`Evento emitido: ${eventName}`);
  }
  
  // Método para emitir eventos relacionados a sessões
  emitSessionEvent(sessionId, eventType, data) {
    const eventName = `session:${eventType}:${sessionId}`;
    this.emit(eventName, data);
    this.emit('session:any', { sessionId, eventType, data });
    logger.debug(`Evento emitido: ${eventName}`);
  }
  
  // Método para emitir eventos relacionados a contatos
  emitContactEvent(sessionId, eventType, data) {
    const eventName = `contact:${eventType}:${sessionId}`;
    this.emit(eventName, data);
    this.emit('contact:any', { sessionId, eventType, data });
    logger.debug(`Evento emitido: ${eventName}`);
  }
  
  // Método para registrar listener para eventos de mensagem
  onMessageEvent(sessionId, eventType, listener) {
    const eventName = eventType === '*' 
      ? 'message:any'
      : `message:${eventType}:${sessionId}`;
    this.on(eventName, listener);
    return this;
  }
  
  // Método para registrar listener para eventos de sessão
  onSessionEvent(sessionId, eventType, listener) {
    const eventName = eventType === '*' 
      ? 'session:any'
      : `session:${eventType}:${sessionId}`;
    this.on(eventName, listener);
    return this;
  }
  
  // Método para registrar listener para eventos de contato
  onContactEvent(sessionId, eventType, listener) {
    const eventName = eventType === '*' 
      ? 'contact:any'
      : `contact:${eventType}:${sessionId}`;
    this.on(eventName, listener);
    return this;
  }
  
  // Método para remover listener
  removeEventListener(eventName, listener) {
    this.removeListener(eventName, listener);
    return this;
  }
}

// Singleton para garantir uma única instância do serviço de eventos
const eventService = new EventService();

module.exports = eventService;
