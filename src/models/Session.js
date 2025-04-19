const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  authState: {
    type: Object
  },
  qrCode: {
    type: String
  },
  lastConnection: {
    type: Date
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

// Atualizar o timestamp updatedAt antes de salvar
sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
