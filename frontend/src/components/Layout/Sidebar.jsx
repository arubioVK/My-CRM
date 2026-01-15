import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ChevronLeft, ChevronRight, LayoutDashboard, Briefcase, CheckSquare } from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const [crmOpen, setCrmOpen] = useState(true);
    const [showPopover, setShowPopover] = useState(false);
    const sidebarRef = React.useRef(null);

    // Close popover when clicking outside the sidebar
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCrmClick = () => {
        if (isOpen) {
            setCrmOpen(!crmOpen);
        } else {
            setShowPopover(!showPopover);
        }
    };

    return (
        <div
            ref={sidebarRef}
            className={`bg-gray-900 text-white h-full transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} flex flex-col relative`}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-center border-b border-gray-800 flex-shrink-0">
                {isOpen ? <span className="text-xl font-bold">My CRM</span> : <LayoutDashboard size={24} />}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4">
                <ul>
                    {/* CRM Module */}
                    <li className="relative">
                        <div
                            className={`flex items-center px-4 py-3 cursor-pointer hover:bg-gray-800 ${!isOpen && 'justify-center'}`}
                            onClick={handleCrmClick}
                        >
                            <Briefcase size={20} />
                            {isOpen && <span className="ml-3 flex-1">CRM</span>}
                            {isOpen && (
                                <span className={`transform transition-transform ${crmOpen ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                </span>
                            )}
                        </div>

                        {/* Submenu for Expanded Sidebar */}
                        {isOpen && crmOpen && (
                            <ul className="pl-12 space-y-1 mt-1">
                                <li>
                                    <Link to="/clients" className="flex items-center py-2 px-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
                                        <Users size={18} />
                                        <span className="ml-3">Clients</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/tasks" className="flex items-center py-2 px-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md">
                                        <CheckSquare size={18} />
                                        <span className="ml-3">Tasks</span>
                                    </Link>
                                </li>
                            </ul>
                        )}

                        {/* Popover for Collapsed Sidebar */}
                        {!isOpen && showPopover && (
                            <div
                                className="absolute left-full top-0 ml-2 w-48 bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-700"
                            >
                                <div className="absolute top-4 -left-1.5 w-3 h-3 bg-gray-800 border-l border-b border-gray-700 transform rotate-45" />
                                <div className="px-4 py-2 border-b border-gray-700 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">CRM Module</span>
                                </div>
                                <ul>
                                    <li>
                                        <Link
                                            to="/clients"
                                            className="flex items-center py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-700"
                                            onClick={() => setShowPopover(false)}
                                        >
                                            <Users size={16} />
                                            <span className="ml-3">Clients</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/tasks"
                                            className="flex items-center py-2 px-4 text-gray-300 hover:text-white hover:bg-gray-700"
                                            onClick={() => setShowPopover(false)}
                                        >
                                            <CheckSquare size={16} />
                                            <span className="ml-3">Tasks</span>
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </li>
                </ul>
            </nav>

            {/* Collapse Toggle */}
            <div className="p-4 border-t border-gray-800 flex justify-end flex-shrink-0">
                <button onClick={toggleSidebar} className="p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white">
                    {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
