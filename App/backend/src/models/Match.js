const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    text: { type: String, default: '' },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Índice para buscar matches de un usuario
matchSchema.index({ users: 1 });
// Índice para ordenar por último mensaje
matchSchema.index({ 'lastMessage.createdAt': -1 });

module.exports = mongoose.model('Match', matchSchema);
