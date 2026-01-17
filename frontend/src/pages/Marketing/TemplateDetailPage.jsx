import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Save, ArrowLeft, Info, Copy, Plus } from 'lucide-react';

const KEYWORDS = [
    { label: 'Client Name', value: '{{client_name}}' },
    { label: 'Client Email', value: '{{client_email}}' },
    { label: 'Client Phone', value: '{{client_phone}}' },
    { label: 'Client Address', value: '{{client_address}}' },
    { label: 'Current Date', value: '{{date}}' },
];

const TemplateDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const quillRef = useRef(null);

    useEffect(() => {
        if (id) {
            fetchTemplate();
        }
    }, [id]);

    const fetchTemplate = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/crm/email-templates/${id}/`);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching template:', error);
            alert('Error fetching template');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (id) {
                await api.put(`/crm/email-templates/${id}/`, formData);
            } else {
                await api.post('/crm/email-templates/', formData);
            }
            navigate('/marketing/templates');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error saving template');
        } finally {
            setSaving(false);
        }
    };

    const insertKeyword = (keyword) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const cursorPosition = editor.getSelection()?.index || 0;
        editor.insertText(cursorPosition, keyword);
        editor.setSelection(cursorPosition + keyword.length);
        setFormData({ ...formData, body: editor.root.innerHTML });
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/marketing/templates')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {id ? 'Edit Template' : 'New Email Template'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <Save size={18} className="mr-2" />
                    {saving ? 'Saving...' : 'Save Template'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Welcome Email"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject Line
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="e.g., Hello {{client_name}}!"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex justify-between">
                                    Email Body
                                    <span className="text-xs text-gray-400 font-normal">Click a keyword on the right to insert</span>
                                </label>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={formData.body}
                                        onChange={(content) => setFormData({ ...formData, body: content })}
                                        modules={quillModules}
                                        className="h-96"
                                        placeholder="Write your email content here..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <Info size={18} className="mr-2 text-indigo-500" />
                            Keywords
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Use these variables to personalize your emails. They will be replaced with real data when sending.
                        </p>
                        <div className="space-y-3">
                            {KEYWORDS.map((kw) => (
                                <button
                                    key={kw.value}
                                    onClick={() => insertKeyword(kw.value)}
                                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">{kw.label}</p>
                                        <p className="text-xs font-mono text-indigo-500">{kw.value}</p>
                                    </div>
                                    <Plus size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                        <h3 className="text-sm font-bold text-indigo-800 mb-2 uppercase tracking-wider">Pro Tip</h3>
                        <p className="text-sm text-indigo-600 leading-relaxed">
                            You can also manually type keywords anywhere in the subject or body. Make sure to use the exact double curly brace format: <code className="bg-indigo-100 px-1 rounded font-mono">{"{{keyword}}"}</code>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDetailPage;
