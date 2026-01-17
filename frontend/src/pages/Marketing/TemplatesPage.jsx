import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { Plus, Trash2, Edit2, Mail } from 'lucide-react';

const TemplatesPage = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/crm/email-templates/');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.delete(`/crm/email-templates/${id}/`);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Error deleting template');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Email Templates</h1>
                    <p className="text-gray-500 text-sm">Manage your reusable email templates with client variables.</p>
                </div>
                <button
                    onClick={() => navigate('/marketing/templates/new')}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    New Template
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            onClick={() => navigate(`/marketing/templates/${template.id}`)}
                            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer group relative"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Mail size={20} />
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/marketing/templates/${template.id}`);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(e, template.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">{template.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 truncate">{template.subject}</p>
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 text-xs text-gray-400">
                                <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                    <div className="mx-auto w-12 h-12 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-4">
                        <Mail size={24} />
                    </div>
                    <h3 className="text-gray-900 font-medium">No templates yet</h3>
                    <p className="text-gray-500 text-sm mt-1">Create your first email template to get started.</p>
                    <button
                        onClick={() => navigate('/marketing/templates/new')}
                        className="mt-4 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                    >
                        Create Template
                    </button>
                </div>
            )}
        </div>
    );
};

export default TemplatesPage;
