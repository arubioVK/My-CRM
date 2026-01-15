import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Lock, Unlock, Save, X, ArrowLeft, CheckSquare, User, Calendar, Flag, AlertCircle } from 'lucide-react';

const TaskDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState(null);
    const [formData, setFormData] = useState({});
    const [isLocked, setIsLocked] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const lastFetchedIdRef = React.useRef(null);

    useEffect(() => {
        if (lastFetchedIdRef.current === id) return;
        lastFetchedIdRef.current = id;
        fetchTask();
    }, [id]);

    const fetchTask = async () => {
        try {
            const response = await api.get(`/crm/tasks/${id}/`);
            setTask(response.data);
            setFormData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching task:', error);
            alert('Error fetching task details');
            navigate('/tasks');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await api.patch(`/crm/tasks/${id}/`, formData);
            setTask(response.data);
            setIsLocked(true);
            setSaving(false);
        } catch (error) {
            console.error('Error updating task:', error);
            alert('Error updating task details');
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData(task);
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
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{task.title}</h1>
                <div className="w-32"></div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Sidebar (25%) */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Task Info</h3>
                        <div className="space-y-4">
                            <div className="flex items-center text-gray-600">
                                <CheckSquare size={18} className="mr-3 text-gray-400" />
                                <span className="text-sm font-medium">{task.status}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Flag size={18} className="mr-3 text-gray-400" />
                                <span className="text-sm font-medium">{task.priority}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Calendar size={18} className="mr-3 text-gray-400" />
                                <span className="text-sm">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                        <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-4">Related To</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-indigo-500 uppercase font-bold mb-1">Client</p>
                                <Link
                                    to={`/clients/${task.client}`}
                                    className="text-sm text-indigo-700 hover:underline font-medium"
                                >
                                    {task.client_name}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs text-indigo-500 uppercase font-bold mb-1">Assigned To</p>
                                <div className="flex items-center text-sm text-indigo-700 font-medium">
                                    <User size={14} className="mr-2" />
                                    {task.assigned_to_name || 'Unassigned'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel (50%) */}
                <div className="lg:w-1/2">
                    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Task Details</h2>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title || ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        rows="4"
                                        value={formData.description || ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status || ''}
                                            onChange={handleInputChange}
                                            disabled={isLocked}
                                            className={`w-full px-4 py-2 rounded-md border ${isLocked
                                                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                                } transition-all`}
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                        <select
                                            name="priority"
                                            value={formData.priority || ''}
                                            onChange={handleInputChange}
                                            disabled={isLocked}
                                            className={`w-full px-4 py-2 rounded-md border ${isLocked
                                                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                                } transition-all`}
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        name="due_date"
                                        value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                                        onChange={handleInputChange}
                                        disabled={isLocked}
                                        className={`w-full px-4 py-2 rounded-md border ${isLocked
                                            ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                                            } transition-all`}
                                    />
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
                </div>

                {/* Right Sidebar (25%) */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Metadata</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-400">Created At</p>
                                <p className="text-sm text-gray-600">{new Date(task.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Last Updated</p>
                                <p className="text-sm text-gray-600">{new Date(task.updated_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPage;
