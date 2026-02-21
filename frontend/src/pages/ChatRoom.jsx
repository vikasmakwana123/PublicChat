import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Shield } from 'lucide-react';

const ChatRoom = () => {
    const { roomId } = useParams();
    const { state } = useLocation();
    const joiningKey = state?.joiningKey;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [room, setRoom] = useState(null);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch room info and history
        fetchRoomInfo();
        fetchMessages();

        // Connect to Socket.io
        socketRef.current = io(import.meta.env.VITE_API_URL);
        socketRef.current.emit('join_room', { room: roomId });

        socketRef.current.on('receive_message', (message) => {
            // Decrypt if it's a private room message
            const processedMessage = processIncomingMessage(message);
            setMessages((prev) => [...prev, processedMessage]);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchRoomInfo = async () => {
        try {
            const res = await api.get('/rooms');
            const currentRoom = res.data.find(r => r._id === roomId);
            setRoom(currentRoom);
        } catch (err) {
            console.error('Error fetching room info:', err);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/${roomId}`);
            const processedMessages = res.data.map(processIncomingMessage);
            setMessages(processedMessages);
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const processIncomingMessage = (msg) => {
        if (msg.encrypted && joiningKey) {
            try {
                const bytes = CryptoJS.AES.decrypt(msg.content, joiningKey);
                const decryptedContent = bytes.toString(CryptoJS.enc.Utf8);
                return { ...msg, content: decryptedContent || '[Unable to decrypt]' };
            } catch (err) {
                return { ...msg, content: '[Decryption failed]' };
            }
        }
        return msg;
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        let contentToSend = newMessage;
        let isEncrypted = false;

        if (room?.type === 'private' && joiningKey) {
            contentToSend = CryptoJS.AES.encrypt(newMessage, joiningKey).toString();
            isEncrypted = true;
        }

        const messageData = {
            room: roomId,
            sender: user.id,
            senderName: user.username,
            content: contentToSend,
            encrypted: isEncrypted
        };

        socketRef.current.emit('send_message', messageData);
        setNewMessage('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="chat-container">
            <header className="chat-header">
                <button onClick={() => navigate('/')} className="btn-back">
                    <ArrowLeft size={20} />
                </button>
                <div className="room-info">
                    <h2>{room?.name}</h2>
                    {room?.type === 'private' && (
                        <span className="encrypted-tag">
                            <Shield size={14} /> Encrypted
                        </span>
                    )}
                </div>
            </header>

            <div className="messages-area">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender === user.id ? 'own' : ''}`}>
                        <div className="message-info">
                            <span className="sender-name">{msg.senderName}</span>
                            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" disabled={!newMessage.trim()}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatRoom;
