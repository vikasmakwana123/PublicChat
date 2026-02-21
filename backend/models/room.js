const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    type: { type: String, enum: ['public', 'private'], default: 'public' },
    joiningKey: { type: String }, // Only for private rooms
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
