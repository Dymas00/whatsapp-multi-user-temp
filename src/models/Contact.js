const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  jid: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  pushName: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastInteraction: {
    type: Date
  },
  profilePictureUrl: {
    type: String
  },
  status: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Índice composto para garantir unicidade de contato por sessão
contactSchema.index({ session: 1, jid: 1 }, { unique: true });

// Atualizar o timestamp updatedAt antes de salvar
contactSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
