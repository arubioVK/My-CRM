import React, { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ user, setUser }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout/');
            setUser(null);
            navigate('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
            {/* Left side (Breadcrumbs or Title could go here) */}
            <div className="text-lg font-medium text-gray-700">
            </div>

            {/* Right side - User Profile */}
            <div className="relative">
                <button
                    className="flex items-center space-x-3 focus:outline-none"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                        <User size={18} />
                    </div>
                    <span className="text-gray-700 font-medium">{user?.username || 'User'}</span>
                    <ChevronDown size={16} className="text-gray-400" />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-10">
                        <button
                            onClick={() => {
                                navigate('/settings');
                                setDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <User size={16} className="mr-2" />
                            Settings
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <LogOut size={16} className="mr-2" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Topbar;
