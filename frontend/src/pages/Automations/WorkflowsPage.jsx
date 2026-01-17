import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Trash2, Edit2, GitMerge, Power } from 'lucide-react';

const WorkflowsPage = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const response = await api.get('/crm/workflows/');
            setWorkflows(response.data);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this workflow?')) return;
        try {
            await api.delete(`/crm/workflows/${id}/`);
            setWorkflows(workflows.filter(w => w.id !== id));
        } catch (error) {
            console.error('Error deleting workflow:', error);
            alert('Error deleting workflow');
        }
    };

    const toggleStatus = async (e, workflow) => {
        e.stopPropagation();
        try {
            const updatedWorkflow = { ...workflow, is_active: !workflow.is_active };
            const response = await api.put(`/crm/workflows/${workflow.id}/`, updatedWorkflow);
            setWorkflows(workflows.map(w => w.id === workflow.id ? response.data : w));
        } catch (error) {
            console.error('Error updating workflow status:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Workflows</h1>
                    <p className="text-gray-500 text-sm">Automate your business processes with triggers and actions.</p>
                </div>
                <button
                    onClick={() => navigate('/automations/workflows/new')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Create Workflow
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : workflows.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            onClick={() => navigate(`/automations/workflows/${workflow.id}`)}
                            className={`bg-white border rounded-lg p-5 hover:shadow-md transition-all cursor-pointer group flex items-center justify-between ${workflow.is_active ? 'border-gray-200' : 'border-gray-100 opacity-75'}`}
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`p-3 rounded-lg ${workflow.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <GitMerge size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                                            IF {workflow.trigger_type.replace('_', ' ')}
                                        </span>
                                        <span>→</span>
                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
                                            THEN {workflow.action_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => toggleStatus(e, workflow)}
                                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${workflow.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    <Power size={14} className="mr-1" />
                                    {workflow.is_active ? 'Active' : 'Inactive'}
                                </button>
                                <div className="border-l border-gray-200 h-8 mx-2"></div>
                                <button
                                    onClick={(e) => handleDelete(e, workflow.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <GitMerge size={24} />
                    </div>
                    <h3 className="text-gray-900 font-medium">No workflows yet</h3>
                    <p className="text-gray-500 text-sm mt-1">Create your first automation to save time.</p>
                    <button
                        onClick={() => navigate('/automations/workflows/new')}
                        className="mt-4 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                    >
                        Create Workflow
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkflowsPage;
