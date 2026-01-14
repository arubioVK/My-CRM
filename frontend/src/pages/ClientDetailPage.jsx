import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, Unlock, Save, X, ArrowLeft, User, Mail, Phone, MapPin, CheckSquare, Plus, ChevronRight } from 'lucide-react';

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [formData, setFormData] = useState({});
    const [isLocked, setIsLocked] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const lastFetchedIdRef = React.useRef(null);

    useEffect(() => {
        if (lastFetchedIdRef.current === id) return;
        lastFetchedIdRef.current = id;
        fetchClient();
        fetchTasks();
    }, [id]);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/crm/tasks/', { params: { client_id: id } });
            setTasks(response.data);
            setLoadingTasks(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoadingTasks(false);
        }
    };

    const fetchClient = async () => {
        try {
            const response = await api.get(`/crm/clients/${id}/`);
            setClient(response.data);
            setFormData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching client:', error);
            alert('Error fetching client details');
            navigate('/clients');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.patch(`/crm/clients/${id}/`, formData);
            setClient(response.data);
            setIsLocked(true);
            setSaving(false);
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Error updating client details');
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(client);
        setIsLocked(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/clients')}
                    className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Clients
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
                <div className="w-32"></div> {/* Spacer for alignment */}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar (25%) */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center text-gray-600">
                                <User size={18} className="mr-3 text-gray-400" />
                                <span className="text-sm">{client.name}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Mail size={18} className="mr-3 text-gray-400" />
                                <span className="text-sm truncate">{client.email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Phone size={18} className="mr-3 text-gray-400" />
                                <span className="text-sm">{client.phone}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-2">Activity</h3>
                        <p className="text-xs text-indigo-600 italic">No recent activity recorded.</p>
                    </div>
                </div>

                {/* Center Panel (50%) */}
                <div className="lg:w-1/2">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Client Properties</h2>
                            <button
                                onClick={() => setIsLocked(!isLocked)}
                                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isLocked
                                    ? 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                    }`}
                            >
                                {isLocked ? (
                                    <><Lock size={14} className="mr-2" /> Unlock</>
                                ) : (
                                    <><Unlock size={14} className="mr-2" /> Locked</>
                                )}
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        rows="3"
                                        value={formData.address || ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    ></textarea>
                                </div>
                            </div>

                            {!isLocked && (
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        ) : (
                                            <Save size={16} className="mr-2" />
                                        )}
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="mt-8 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                <CheckSquare size={20} className="mr-2 text-indigo-600" />
                                Related Tasks
                            </h2>
                            <button
                                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                onClick={() => navigate('/tasks')}
                            >
                                <Plus size={16} className="mr-1" /> Add Task
                            </button>
                        </div>
                        <div className="p-6">
                            {loadingTasks ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : tasks.length > 0 ? (
                                <div className="space-y-4">
                                    {tasks.map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => navigate(`/tasks/${task.id}`)}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                                        >
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                                                <div className="flex items-center mt-1 space-x-3">
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${task.status === 'done' ? 'bg-green-100 text-green-800' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                        task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                    {task.due_date && (
                                                        <span className="text-xs text-gray-400">
                                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate('/tasks')}
                                                className="text-gray-400 hover:text-indigo-600"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500 italic">No tasks found for this client.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (25%) */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Metadata</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400">Created At</p>
                                <p className="text-sm text-gray-600">{new Date(client.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Owner</p>
                                <p className="text-sm text-gray-600">{client.owner_name || 'Unassigned'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
                        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2">Notes</h3>
                        <p className="text-xs text-amber-600 italic">No notes available for this client.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
