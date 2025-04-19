const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  remoteJid: {
    type: String,
    required: true
  },
  fromMe: {
    type: Boolean,
    default: false
  },
  participant: {
    type: String
  },
  pushName: {
    type: String
  },
  timestamp: {
    type: Number,
    required: true
  },
  message: {
    type: Object,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact', 'unknown'],
    default: 'unknown'
  },
  content: {
    type: String
  },
  mediaUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para melhorar a performance das consultas
messageSchema.index({ session: 1, timestamp: -1 });
messageSchema.index({ remoteJid: 1, session: 1 });
messageSchema.index({ messageId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
