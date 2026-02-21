const express = require('express');
const router = express.Router();
const Room = require('../models/room');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get all rooms (listed in tabular format on frontend)
router.get('/', async (req, res) => {
    try {
        const rooms = await Room.find().populate('creator', 'username');
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new room
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, description, type, joiningKey } = req.body;

        const newRoom = new Room({
            name,
            description,
            type,
            joiningKey: type === 'private' ? joiningKey : undefined,
            creator: req.user.id
        });

        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify joining key for private room
router.post('/join', authenticate, async (req, res) => {
    try {
        const { roomId, joiningKey } = req.body;
        const room = await Room.findById(roomId);

        if (!room) return res.status(404).json({ message: 'Room not found' });

        if (room.type === 'private' && room.joiningKey !== joiningKey) {
            return res.status(400).json({ message: 'Invalid joining key' });
        }

        res.json({ message: 'Access granted', room });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
