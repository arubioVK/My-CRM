import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../api';
import { Settings as SettingsIcon, Mail, Globe, Shield, CheckCircle2, AlertCircle, ExternalLink, Save, Users, LogOut } from 'lucide-react';

const SettingsPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('email');
    const [signature, setSignature] = useState('');
    const [savingSignature, setSavingSignature] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        is_staff: false,
        is_superuser: false,
        config: {
            see_all_clients: true,
            see_all_tasks: true
        }
    });


    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleCallback(code);
        }
        checkConnection();
        fetchUserConfig();
        fetchCurrentUser();
    }, [searchParams]);

    useEffect(() => {
        if (activeTab === 'users' && (currentUser?.is_staff || currentUser?.is_superuser)) {
            fetchUsers();
        }
    }, [activeTab, currentUser]);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/auth/me/');
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Failed to fetch current user', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingUser) {
                await api.put(`/auth/users/${editingUser.id}/`, userForm);
                setStatus({ type: 'success', message: 'User updated successfully.' });
            } else {
                await api.post('/auth/users/', userForm);
                setStatus({ type: 'success', message: 'User created successfully.' });
            }
            setShowUserModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user', error);
            setStatus({ type: 'error', message: 'Error saving user.' });
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/auth/users/${userId}/`);
            setStatus({ type: 'success', message: 'User deleted successfully.' });
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            setStatus({ type: 'error', message: 'Error deleting user.' });
        } finally {
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const openAddUser = () => {
        setEditingUser(null);
        setUserForm({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            is_staff: false,
            is_superuser: false,
            config: {
                see_all_clients: true,
                see_all_tasks: true
            }
        });
        setShowUserModal(true);
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setUserForm({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            password: '', // Leave blank to keep current
            is_staff: user.is_staff,
            is_superuser: user.is_superuser,
            config: {
                see_all_clients: user.config?.see_all_clients ?? true,
                see_all_tasks: user.config?.see_all_tasks ?? true
            }
        });
        setShowUserModal(true);
    };

    const checkConnection = async () => {
        try {
            const response = await api.get('/crm/google/auth/check/');
            setIsGoogleConnected(response.data.connected);
        } catch (error) {
            console.error('Failed to check Google connection', error);
            setIsGoogleConnected(false);
        }
    };

    const fetchUserConfig = async () => {
        try {
            const response = await api.get('/crm/config/');
            setSignature(response.data.email_signature || '');
        } catch (error) {
            console.error('Failed to fetch user config', error);
        }
    };

    const handleSaveSignature = async () => {
        setSavingSignature(true);
        try {
            await api.patch('/crm/config/', {
                email_signature: signature
            });
            setStatus({ type: 'success', message: 'Settings saved successfully.' });
        } catch (error) {
            console.error('Failed to save settings', error);
            setStatus({ type: 'error', message: 'Error saving settings.' });
        } finally {
            setSavingSignature(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const handleConnectGoogle = async () => {
        setLoading(true);
        try {
            const response = await api.get('/crm/google/auth/');
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Failed to get auth URL', error);
            setStatus({ type: 'error', message: 'Failed to initiate Google connection.' });
            setLoading(false);
        }
    };

    const handleCallback = async (code) => {
        setLoading(true);
        try {
            await api.get(`/crm/google/callback/?code=${code}`);
            setStatus({ type: 'success', message: 'Successfully connected Google account!' });
            setIsGoogleConnected(true);
            // Clear URL params
            navigate('/settings', { replace: true });
        } catch (error) {
            console.error('OAuth callback failed', error);
            setStatus({ type: 'error', message: 'Failed to complete Google connection.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!window.confirm('Are you sure you want to disconnect your Google account? You will no longer be able to send or receive emails through the CRM.')) {
            return;
        }
        setLoading(true);
        try {
            await api.post('/crm/google/auth/disconnect/');
            setIsGoogleConnected(false);
            setStatus({ type: 'success', message: 'Successfully disconnected Google account.' });
        } catch (error) {
            console.error('Failed to disconnect Google account', error);
            setStatus({ type: 'error', message: 'Failed to disconnect Google account.' });
        } finally {
            setLoading(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const tabs = [
        { id: 'email', name: 'Email', icon: Mail },
        { id: 'integrations', name: 'Integrations', icon: Globe },
        { id: 'general', name: 'General', icon: SettingsIcon },
        { id: 'security', name: 'Security', icon: Shield },
    ];

    if (currentUser?.is_staff || currentUser?.is_superuser) {
        tabs.push({ id: 'users', name: 'Users', icon: Users });
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <SettingsIcon size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            </div>

            {status && (
                <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 transition-all duration-300 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{status.message}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-4 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <tab.icon size={16} />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-8">
                    {activeTab === 'email' && (
                        <div className="max-w-2xl space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Gmail Connectivity</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Connect your Gmail account to send and receive emails directly from the CRM.
                                </p>

                                <div className="flex items-start justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex space-x-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Mail className="text-red-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Google Inbox</h3>
                                            <div className="mt-2 flex items-center">
                                                {isGoogleConnected ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-green-100 text-green-700 uppercase">
                                                        Connected
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-medium bg-gray-200 text-gray-600 uppercase">
                                                        Not Connected
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {isGoogleConnected ? (
                                            <button
                                                onClick={handleDisconnectGoogle}
                                                disabled={loading}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {loading ? 'Disconnecting...' : 'Disconnect'}
                                                {!loading && <LogOut size={14} className="ml-2" />}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleConnectGoogle}
                                                disabled={loading}
                                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {loading ? 'Connecting...' : 'Connect'}
                                                {!loading && <ExternalLink size={14} className="ml-2" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Signature</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    This signature will be appended to the end of your emails. Supports rich text and HTML.
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <ReactQuill
                                            theme="snow"
                                            value={signature}
                                            onChange={setSignature}
                                            className="h-48"
                                        />
                                    </div>
                                    <div className="flex justify-end pt-12">
                                        <button
                                            onClick={handleSaveSignature}
                                            disabled={savingSignature}
                                            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {savingSignature ? (
                                                <span>Saving...</span>
                                            ) : (
                                                <>
                                                    <Save size={18} />
                                                    <span>Save Signature</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Preview</h4>
                                    <div
                                        className="text-sm text-gray-700 bg-white p-4 rounded border border-blue-50 min-h-[60px] prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: signature || '<span class="text-gray-400 italic">No signature configured</span>' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'integrations' && (
                        <div className="max-w-xl">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Other Integrations</h2>
                            <p className="text-sm text-gray-500 mb-8">
                                More integrations with external services will be available soon.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start justify-between p-6 bg-gray-50 rounded-xl border border-gray-100 opacity-60">
                                    <div className="flex space-x-4">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <Globe className="text-blue-500" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Website Widget</h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Capture leads directly from your website.
                                            </p>
                                        </div>
                                    </div>
                                    <button disabled className="px-4 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed">
                                        Coming Soon
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (currentUser?.is_staff || currentUser?.is_superuser) && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                                    <p className="text-sm text-gray-500">Manage application users and their roles.</p>
                                </div>
                                <button
                                    onClick={openAddUser}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all flex items-center"
                                >
                                    <Users size={16} className="mr-2" />
                                    Add User
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                            {user.first_name?.[0] || user.username[0].toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                                                            <div className="text-xs text-gray-500">{user.username} • {user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.is_superuser && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">SuperAdmin</span>
                                                        )}
                                                        {user.is_staff && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">Admin</span>
                                                        )}
                                                        {!user.is_staff && !user.is_superuser && (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">User</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openEditUser(user)}
                                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        disabled={user.id === currentUser.id}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'general' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <SettingsIcon size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">
                                We are working to bring you more configuration options in this section.
                            </p>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                <Shield size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Coming Soon</h3>
                            <p className="text-sm text-gray-500 max-w-xs mt-2">
                                We are working to bring you more security options in this section.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h2>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <AlertCircle size={24} className="rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={userForm.username}
                                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={userForm.email}
                                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={userForm.first_name}
                                        onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={userForm.last_name}
                                        onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex space-x-6 pt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={userForm.is_staff}
                                        onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Admin (Staff)</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={userForm.is_superuser}
                                        onChange={(e) => setUserForm({ ...userForm, is_superuser: e.target.checked })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">SuperAdmin</span>
                                </label>
                            </div>
                            <div className="flex space-x-6 pt-2 pb-2 border-t border-gray-100 mt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={userForm.config.see_all_clients}
                                        onChange={(e) => setUserForm({
                                            ...userForm,
                                            config: { ...userForm.config, see_all_clients: e.target.checked }
                                        })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Can See All Clients</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={userForm.config.see_all_tasks}
                                        onChange={(e) => setUserForm({
                                            ...userForm,
                                            config: { ...userForm.config, see_all_tasks: e.target.checked }
                                        })}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700">Can See All Tasks</span>
                                </label>
                            </div>
                            <div className="pt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowUserModal(false)}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
