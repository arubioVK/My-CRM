import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Lock, Unlock, Save, X, ArrowLeft, User, Mail, Phone, MapPin, CheckSquare, Plus, ChevronRight, StickyNote, Send, Trash2, RefreshCw, Inbox } from 'lucide-react';
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
    const [notes, setNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(true);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [addingNote, setAddingNote] = useState(false);
    const [emails, setEmails] = useState([]);
    const [loadingEmails, setLoadingEmails] = useState(true);
    const [syncingEmails, setSyncingEmails] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailForm, setEmailForm] = useState({
        subject: '',
        body: '',
        attachments: [],
        includeSignature: true,
        thread_id: null,
        in_reply_to: null
    });
    const [sendingEmail, setSendingEmail] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [showViewEmailModal, setShowViewEmailModal] = useState(false);
    const lastFetchedIdRef = React.useRef(null);

    useEffect(() => {
        if (lastFetchedIdRef.current === id) return;
        lastFetchedIdRef.current = id;
        fetchClient();
        fetchTasks();
        fetchNotes();
        fetchEmails();
        fetchTemplates();
        handleSyncEmails(true); // Auto-sync silently on mount
    }, [id]);

    const fetchTasks = async () => {
        try {
            const response = await api.get('/crm/tasks/', { params: { client_id: id } });
            // Handle paginated response: use data.results if present, else fallback to data directly
            setTasks(response.data.results || response.data);
            setLoadingTasks(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoadingTasks(false);
        }
    };

    const fetchNotes = async () => {
        try {
            const response = await api.get('/crm/notes/', { params: { client_id: id } });
            setNotes(response.data.results || response.data);
            setLoadingNotes(false);
        } catch (error) {
            console.error('Error fetching notes:', error);
            setLoadingNotes(false);
        }
    };

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNoteContent.trim() || addingNote) return;

        setAddingNote(true);
        try {
            const response = await api.post('/crm/notes/', {
                content: newNoteContent,
                client: id
            });
            setNotes(prev => [response.data, ...prev]);
            setNewNoteContent('');
            setAddingNote(false);
        } catch (error) {
            console.error('Error adding note:', error);
            alert('Error adding note');
            setAddingNote(false);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;
        try {
            await api.delete(`/crm/notes/${noteId}/`);
            setNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Error deleting note');
        }
    };

    const fetchEmails = async () => {
        try {
            const response = await api.get('/crm/emails/', { params: { client_id: id } });
            setEmails(response.data.results || response.data);
            setLoadingEmails(false);
        } catch (error) {
            console.error('Error fetching emails:', error);
            setLoadingEmails(false);
        }
    };

    const handleSyncEmails = async (silent = false) => {
        setSyncingEmails(true);
        try {
            await api.post('/crm/emails/sync/');
            await fetchEmails();
            setSyncingEmails(false);
        } catch (error) {
            console.error('Error syncing emails:', error);
            if (!silent) {
                alert('Error syncing emails. Please make sure your Google account is connected in Settings.');
            }
            setSyncingEmails(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/crm/email-templates/');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleApplyTemplate = (templateId) => {
        const template = templates.find(t => t.id === parseInt(templateId));
        if (!template) return;

        let subject = template.subject;
        let body = template.body;

        const replacements = {
            '{{client_name}}': client.name || '',
            '{{client_email}}': client.email || '',
            '{{client_phone}}': client.phone || '',
            '{{client_address}}': client.address || '',
            '{{date}}': new Date().toLocaleDateString()
        };

        Object.keys(replacements).forEach(key => {
            const value = replacements[key];
            subject = subject.split(key).join(value);
            body = body.split(key).join(value);
        });

        setEmailForm({
            ...emailForm,
            subject: subject,
            body: body
        });
        setSelectedTemplateId(templateId);
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setSendingEmail(true);
        try {
            const formData = new FormData();
            formData.append('to_email', client.email);
            formData.append('subject', emailForm.subject);
            formData.append('body', emailForm.body);
            formData.append('client_id', id);
            formData.append('include_signature', emailForm.includeSignature);
            if (emailForm.thread_id) formData.append('thread_id', emailForm.thread_id);
            if (emailForm.in_reply_to) formData.append('in_reply_to', emailForm.in_reply_to);

            emailForm.attachments.forEach(file => {
                formData.append('attachments', file);
            });

            const response = await api.post('/crm/emails/send/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setEmails(prev => [response.data, ...prev]);
            setShowEmailModal(false);
            setEmailForm({ subject: '', body: '', attachments: [], includeSignature: true, thread_id: null, in_reply_to: null });
            setSendingEmail(false);
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Error sending email. Please make sure your Google account is connected.');
            setSendingEmail(false);
        }
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const handleViewEmail = (email) => {
        setSelectedEmail(email);
        setShowViewEmailModal(true);
    };

    const handleReply = (email) => {
        const replySubject = email.subject.toLowerCase().startsWith('re:')
            ? email.subject
            : `Re: ${email.subject}`;

        // Simple quoting: wrap original body in a blockquote-like structure
        const quotedBody = `<br><br>On ${new Date(email.timestamp).toLocaleString()}, ${email.from_email} wrote:<br><blockquote>${email.body}</blockquote>`;

        setEmailForm({
            subject: replySubject,
            body: quotedBody,
            attachments: [],
            includeSignature: true,
            thread_id: email.thread_id,
            in_reply_to: email.message_id
        });
        setShowViewEmailModal(false);
        setShowEmailModal(true);
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

                    {/* Emails / Activity Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center">
                                <Inbox size={14} className="mr-2" />
                                Activity / Emails
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowEmailModal(true)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors"
                                    title="Send Email"
                                >
                                    <Send size={14} />
                                </button>
                                <button
                                    onClick={handleSyncEmails}
                                    disabled={syncingEmails}
                                    className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition-colors disabled:opacity-50"
                                    title="Sync Now"
                                >
                                    <RefreshCw size={14} className={syncingEmails ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {loadingEmails ? (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : emails.length > 0 ? (
                                <div className="space-y-3">
                                    {emails.map(email => (
                                        <div
                                            key={email.id}
                                            onClick={() => handleViewEmail(email)}
                                            className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-white cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-[11px] font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                    {email.subject || '(No Subject)'}
                                                </h4>
                                            </div>
                                            <p className="text-[10px] text-gray-500 line-clamp-2 italic">
                                                {email.body ? stripHtml(email.body).substring(0, 100) : 'No content available.'}
                                            </p>
                                            <div className="mt-2 flex justify-between items-center text-[9px] text-gray-400">
                                                <span className="truncate max-w-[100px]">
                                                    {email.from_email === 'me' ? 'Sent' : 'From: ' + email.from_email}
                                                </span>
                                                <span>{new Date(email.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-[11px] text-gray-500 italic">No activity found.</p>
                                </div>
                            )}
                        </div>
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
                            <div className="flex items-center space-x-4">
                                <button
                                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    onClick={() => navigate(`/tasks?client_id=${id}`)}
                                >
                                    <ChevronRight size={16} className="mr-1" /> View tasks
                                </button>
                                <button
                                    className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                    onClick={() => navigate('/tasks')}
                                >
                                    <Plus size={16} className="mr-1" /> Add Task
                                </button>
                            </div>
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

                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center">
                            <StickyNote size={18} className="mr-2 text-amber-600" />
                            <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Notes</h3>
                        </div>
                        <div className="p-4">
                            <form onSubmit={handleAddNote} className="mb-4">
                                <div className="relative">
                                    <textarea
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        placeholder="Add a note..."
                                        rows="2"
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none pr-10"
                                    ></textarea>
                                    <button
                                        type="submit"
                                        disabled={!newNoteContent.trim() || addingNote}
                                        className="absolute right-2 bottom-2 p-1.5 text-amber-600 hover:text-amber-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </form>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                {loadingNotes ? (
                                    <div className="flex justify-center py-4">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500"></div>
                                    </div>
                                ) : notes.length > 0 ? (
                                    notes.map(note => (
                                        <div key={note.id} className="group p-3 bg-amber-50 rounded-lg border border-amber-100 relative">
                                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-[10px] font-medium text-amber-700 bg-amber-200 px-1.5 py-0.5 rounded uppercase">
                                                        {note.author_name || 'Admin'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(note.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-center text-gray-400 italic py-4">No notes available for this client.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">New Email to {client.name}</h3>
                            <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
                                    <input
                                        type="text"
                                        value={client.email}
                                        disabled
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm"
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Use Template</label>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => handleApplyTemplate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="">Select a template...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                                <input
                                    type="text"
                                    required
                                    value={emailForm.subject}
                                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Enter subject line..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Message</label>
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                    <ReactQuill
                                        theme="snow"
                                        value={emailForm.body}
                                        onChange={(content) => setEmailForm({ ...emailForm, body: content })}
                                        modules={quillModules}
                                        className="h-64"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 py-2 pt-12">
                                <input
                                    type="checkbox"
                                    id="includeSignature"
                                    checked={emailForm.includeSignature}
                                    onChange={(e) => setEmailForm({ ...emailForm, includeSignature: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor="includeSignature" className="text-sm text-gray-700 font-medium cursor-pointer">
                                    Include automatic signature
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Attachments</label>
                                <div className="mt-1 flex flex-col space-y-2">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            setEmailForm(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    {emailForm.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {emailForm.attachments.map((file, idx) => (
                                                <div key={idx} className="flex items-center bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-700">
                                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEmailForm(prev => ({
                                                            ...prev,
                                                            attachments: prev.attachments.filter((_, i) => i !== idx)
                                                        }))}
                                                        className="ml-2 text-gray-400 hover:text-red-500"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEmailModal(false)}
                                    className="px-6 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sendingEmail}
                                    className="flex items-center px-8 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {sendingEmail ? (
                                        <RefreshCw size={16} className="mr-2 animate-spin" />
                                    ) : (
                                        <Send size={16} className="mr-2" />
                                    )}
                                    {sendingEmail ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* View Email Modal */}
            {showViewEmailModal && selectedEmail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase rounded">Subject</span>
                                    <h3 className="text-xl font-extrabold text-gray-900">{selectedEmail.subject || '(No Subject)'}</h3>
                                </div>
                                <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <User size={14} className="mr-1.5 text-gray-400" />
                                        <span className="font-medium">{selectedEmail.from_email === 'me' ? 'You' : selectedEmail.from_email}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-400">
                                        <RefreshCw size={14} className="mr-1.5" />
                                        <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewEmailModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-10 overflow-y-auto flex-1 bg-white">
                            <div className="max-w-3xl mx-auto">
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    .email-content-wrapper {
                                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                                        line-height: 1.7;
                                        color: #374151;
                                    }
                                    /* Style for the latest message (everything before the first blockquote/thread) */
                                    .email-content-wrapper > *:not(blockquote) {
                                        margin-right: 12%;
                                        margin-bottom: 1.5rem;
                                    }
                                    /* Style for the thread/replies */
                                    .email-content-wrapper blockquote {
                                        border-left: 3px solid #E5E7EB;
                                        padding-left: 2rem;
                                        margin-left: 0;
                                        margin-top: 4rem;
                                        margin-bottom: 2rem;
                                        color: #6B7280;
                                        font-style: normal;
                                        position: relative;
                                    }
                                    /* Add a visual separator/label for the thread */
                                    .email-content-wrapper > blockquote::before {
                                        content: 'Previous messages in this thread';
                                        display: block;
                                        font-size: 11px;
                                        font-weight: 700;
                                        text-transform: uppercase;
                                        color: #9CA3AF;
                                        margin-bottom: 2rem;
                                        letter-spacing: 0.1em;
                                        border-bottom: 1px solid #F3F4F6;
                                        padding-bottom: 0.5rem;
                                    }
                                    .email-content-wrapper p {
                                        margin-bottom: 1.25rem;
                                    }
                                    .email-content-wrapper a {
                                        color: #4F46E5;
                                        text-decoration: underline;
                                    }
                                    .email-content-wrapper img {
                                        max-width: 100%;
                                        height: auto;
                                        border-radius: 0.5rem;
                                    }
                                    .email-content-wrapper hr {
                                        border: 0;
                                        border-top: 1px solid #F3F4F6;
                                        margin: 2rem 0;
                                    }
                                `}} />
                                <div
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.body || '<p class="italic text-gray-400 text-center py-12">No content available.</p>' }}
                                    className="email-content-wrapper prose prose-indigo max-w-none"
                                />
                            </div>
                        </div>

                        <div className="px-8 py-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50/50">
                            <button
                                onClick={() => handleReply(selectedEmail)}
                                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md flex items-center"
                            >
                                <RefreshCw size={16} className="mr-2" />
                                Reply
                            </button>
                            <button
                                onClick={() => setShowViewEmailModal(false)}
                                className="px-8 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDetailPage;
