import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../api';
import { Settings as SettingsIcon, Mail, Globe, Shield, CheckCircle2, AlertCircle, ExternalLink, Save } from 'lucide-react';

const SettingsPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('email');
    const [signature, setSignature] = useState('');
    const [savingSignature, setSavingSignature] = useState(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleCallback(code);
        }
        checkConnection();
        fetchUserConfig();
    }, [searchParams]);

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
            await api.patch('/crm/config/', { email_signature: signature });
            setStatus({ type: 'success', message: 'Signature saved successfully.' });
        } catch (error) {
            console.error('Failed to save signature', error);
            setStatus({ type: 'error', message: 'Error saving signature.' });
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

    const tabs = [
        { id: 'email', name: 'Email', icon: Mail },
        { id: 'integrations', name: 'Integrations', icon: Globe },
        { id: 'general', name: 'General', icon: SettingsIcon },
        { id: 'security', name: 'Security', icon: Shield },
    ];

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
                                                disabled
                                                className="px-4 py-2 text-sm font-medium text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed"
                                            >
                                                Connected
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

                    {(activeTab === 'general' || activeTab === 'security') && (
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
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
