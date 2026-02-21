require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // In production, replace with your frontend URL
        methods: ["GET", "POST"]
    }
});

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const Message = require('./models/message');

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URL || process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';
mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
    res.send('Chat Server is running...');
});

// Socket.io logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_room', (data) => {
        socket.join(data.room);
        console.log(`User ${socket.id} joined room: ${data.room}`);
    });

    socket.on('send_message', async (data) => {
        try {
            // data contains: room, sender, senderName, content, encrypted
            const newMessage = new Message({
                room: data.room,
                sender: data.sender,
                senderName: data.senderName,
                content: data.content,
                encrypted: data.encrypted || false
            });

            await newMessage.save();

            // Broadcast to everyone in the room
            io.to(data.room).emit('receive_message', newMessage);
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Get chat history for a room
app.get('/api/messages/:roomId', async (req, res) => {
    try {
        const messages = await Message.find({ room: req.params.roomId }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

