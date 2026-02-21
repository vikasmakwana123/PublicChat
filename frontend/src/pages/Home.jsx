import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Lock, ChevronRight } from 'lucide-react';

const Home = () => {
    const [rooms, setRooms] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: '', description: '', type: 'public', joiningKey: '' });
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await api.get('/rooms');
            setRooms(res.data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/rooms', newRoom);
            setRooms([...rooms, res.data]);
            setShowCreateModal(false);
            setNewRoom({ name: '', description: '', type: 'public', joiningKey: '' });
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating room');
        }
    };

    const joinRoom = (room) => {
        if (room.type === 'private') {
            const key = prompt('Enter joining key for this private room:');
            if (key) {
                // Verify key on backend
                api.post('/rooms/join', { roomId: room._id, joiningKey: key })
                    .then(() => {
                        navigate(`/chat/${room._id}`, { state: { joiningKey: key } });
                    })
                    .catch(err => alert(err.response?.data?.message || 'Invalid key'));
            }
        } else {
            navigate(`/chat/${room._id}`);
        }
    };

    return (
        <div className="home-container">
            <div className="header-actions">
                <h1>Public Chat Rooms</h1>
                <button onClick={() => setShowCreateModal(true)} className="btn-create">
                    <Plus size={20} /> Create Room
                </button>
            </div>

            <div className="rooms-table-container">
                <table className="rooms-table">
                    <thead>
                        <tr>
                            <th>Room Name</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Created By</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map(room => (
                            <tr key={room._id}>
                                <td>{room.name}</td>
                                <td>{room.description || '-'}</td>
                                <td>
                                    <span className={`badge ${room.type}`}>
                                        {room.type === 'private' ? <Lock size={12} /> : <Users size={12} />}
                                        {room.type}
                                    </span>
                                </td>
                                <td>{room.creator?.username || 'System'}</td>
                                <td>
                                    <button onClick={() => joinRoom(room)} className="btn-join">
                                        Join <ChevronRight size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Room</h2>
                        <form onSubmit={handleCreateRoom}>
                            <div className="form-group">
                                <label>Room Name</label>
                                <input
                                    type="text"
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newRoom.description}
                                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    value={newRoom.type}
                                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                                >
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            {newRoom.type === 'private' && (
                                <div className="form-group">
                                    <label>Joining Key</label>
                                    <input
                                        type="text"
                                        value={newRoom.joiningKey}
                                        onChange={(e) => setNewRoom({ ...newRoom, joiningKey: e.target.value })}
                                        required
                                    />
                                </div>
                            )}
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">Cancel</button>
                                <button type="submit" className="btn-primary">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
