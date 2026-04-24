const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['like', 'dislike', 'superlike'],
    default: 'like',
  },
}, {
  timestamps: true,
});

// Índice compuesto único: un usuario solo puede dar like/dislike una vez a otro
likeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });
// Para buscar likes inversos rápidamente
likeSchema.index({ toUser: 1, fromUser: 1 });

module.exports = mongoose.model('Like', likeSchema);
