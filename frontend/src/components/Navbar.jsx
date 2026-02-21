import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, MessageSquare, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">
                    <MessageSquare size={24} />
                    <span>PublicChat</span>
                </Link>
            </div>
            <div className="nav-links">
                {user ? (
                    <>
                        <div className="user-info">
                            <User size={18} />
                            <span>{user.username}</span>
                        </div>
                        <button onClick={handleLogout} className="btn-logout">
                            <LogOut size={18} /> Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                        <Link to="/register" className="btn-register">Register</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
