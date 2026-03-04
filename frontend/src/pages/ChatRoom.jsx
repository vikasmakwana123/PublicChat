import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Shield, Plus, Image, FileText, Terminal, Copy, Check } from 'lucide-react';

const ChatRoom = () => {
    const { roomId } = useParams();
    const { state } = useLocation();
    const joiningKey = state?.joiningKey;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [room, setRoom] = useState(null);
    const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
    const [isClipableMode, setIsClipableMode] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const socketRef = useRef();
    const messagesEndRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
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
        if (e) e.preventDefault();
        if (!newMessage.trim() && !isUploading) return;

        let contentToSend = newMessage;
        let isEncrypted = false;
        let messageType = isClipableMode ? 'clipable' : 'text';

        if (room?.type === 'private' && joiningKey) {
            contentToSend = CryptoJS.AES.encrypt(newMessage, joiningKey).toString();
            isEncrypted = true;
        }

        const messageData = {
            room: roomId,
            sender: user.id,
            senderName: user.username,
            content: contentToSend,
            messageType: messageType,
            encrypted: isEncrypted
        };

        socketRef.current.emit('send_message', messageData);
        setNewMessage('');
        setIsClipableMode(false); // Reset mode after sending
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setAttachmentMenuOpen(false);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const messageData = {
                room: roomId,
                sender: user.id,
                senderName: user.username,
                content: res.data.name,
                messageType: type,
                fileUrl: res.data.url,
                encrypted: false // Files are not encrypted for simplicity
            };

            socketRef.current.emit('send_message', messageData);
        } catch (err) {
            console.error('Upload failed:', err);
            alert('File upload failed. Please try again.');
        } finally {
            setIsUploading(false);
            // Reset inputs
            if (imageInputRef.current) imageInputRef.current.value = '';
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const renderMessageContent = (msg) => {
        const type = msg.messageType || 'text';

        if (type === 'image') {
            return (
                <div className="message-media">
                    <img src={msg.fileUrl} alt="Sent" className="message-image" onClick={() => window.open(msg.fileUrl, '_blank')} />
                    {msg.content && <p className="media-caption">{msg.content}</p>}
                </div>
            );
        }

        if (type === 'file') {
            return (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="message-file">
                    <div className="file-icon"><FileText size={20} /></div>
                    <div className="file-info">
                        <span className="file-name">{msg.content}</span>
                        <span className="file-size">Click to open PDF</span>
                    </div>
                </a>
            );
        }

        if (type === 'clipable') {
            return (
                <div className="clipable-block">
                    <div style={{ paddingBottom: "10px" }}>
                        <span className="clipable-badge">Text Block</span>
                        <button className={`btn-copy ${copiedId === msg._id ? 'success' : ''}`} onClick={() => copyToClipboard(msg.content, msg._id)} >
                            {copiedId === msg._id ? <Check size={14} /> : <Copy size={14} />}
                            {copiedId === msg._id ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    {msg.content}
                </div>
            );
        }

        return <div className="message-content">{msg.content}</div>;
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
                        {renderMessageContent(msg)}
                    </div>
                ))}
                {isUploading && (
                    <div className="message own">
                        <div className="message-content uploading">
                            Uploading file...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="message-form">
                <div className="attachment-container">
                    <button type="button" className="btn-attach" onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}>
                        <Plus size={20} className={attachmentMenuOpen ? 'rotate-45' : ''} />
                    </button>

                    {attachmentMenuOpen && (
                        <div className="attachment-menu">
                            <div className="menu-item" onClick={() => imageInputRef.current.click()}>
                                <Image size={18} />
                                <span style={{ color: 'black' }}>Image</span>
                            </div>
                            <div className="menu-item" onClick={() => fileInputRef.current.click()}>
                                <FileText size={18} />
                                <span style={{ color: 'black' }}>PDF File</span>
                            </div>
                            <div className={`menu-item ${isClipableMode ? 'active' : ''}`} onClick={() => {
                                setIsClipableMode(!isClipableMode);
                                setAttachmentMenuOpen(false);
                            }}>
                                <Terminal size={18} />
                                <span style={{ color: 'black' }}>{isClipableMode ? 'Normal Mode' : 'Writing Block'}</span>
                            </div>
                        </div>
                    )}

                    <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf" onChange={(e) => handleFileUpload(e, 'file')} />
                </div>

                {isClipableMode ? (
                    <textarea
                        placeholder="Type code or copyable text..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                ) : (
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                )}
                <button type="submit" disabled={!newMessage.trim() && !isUploading}>
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default ChatRoom;
