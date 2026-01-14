import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight, LayoutDashboard, Briefcase, CheckSquare } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const [crmOpen, setCrmOpen] = useState(true);

    return (
        <div className={`bg-gray-900 text-white h-full transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} flex flex-col`}>
            {/* Header */}
            <div className="h-16 flex items-center justify-center border-b border-gray-800">
                {isOpen ? <span className="text-xl font-bold">My CRM</span> : <LayoutDashboard size={24} />}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 overflow-y-auto">
                <ul>
                    {/* CRM Module */}
                    <li>
                        <div
                            className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-800 ${!isOpen && 'justify-center'}`}
                            onClick={() => isOpen && setCrmOpen(!crmOpen)}
                        >
                            <Briefcase size={20} />
                            {isOpen && <span className="ml-3 flex-1">CRM</span>}
                            {isOpen && (
                                <span className={`transform transition-transform ${crmOpen ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                </span>
                            )}
                        </div>

                        {/* Submenu */}
                        {(crmOpen || !isOpen) && (
                            <ul className={`${isOpen ? 'pl-12' : 'flex flex-col items-center'} space-y-1 mt-1`}>
                                <li>
                                    <Link to="/clients" className="flex items-center py-2 px-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
                                        <Users size={18} />
                                        {isOpen && <span className="ml-3">Clients</span>}
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/tasks" className="flex items-center py-2 px-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
                                        <CheckSquare size={18} />
                                        {isOpen && <span className="ml-3">Tasks</span>}
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                </ul>
            </nav>

            {/* Collapse Toggle */}
            <div className="p-4 border-t border-gray-800 flex justify-end">
                <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white">
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
