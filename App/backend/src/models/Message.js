const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'El mensaje no puede estar vacío'],
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres'],
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Índice para obtener mensajes de un match ordenados por fecha
messageSchema.index({ match: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
