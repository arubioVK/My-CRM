import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Settings as SettingsIcon, Mail, Globe, Shield, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const SettingsPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            handleCallback(code);
        }
        checkConnection();
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

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <SettingsIcon size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            </div>

            {status && (
                <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-medium">{status.message}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6" aria-label="Tabs">
                        <button className="border-indigo-500 text-indigo-600 border-b-2 py-4 px-1 text-sm font-medium">
                            Integrations
                        </button>
                        <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 py-4 px-1 text-sm font-medium">
                            General
                        </button>
                        <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 py-4 px-1 text-sm font-medium">
                            Security
                        </button>
                    </nav>
                </div>

                <div className="p-8">
                    <div className="max-w-xl">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Connected Accounts</h2>
                        <p className="text-sm text-gray-500 mb-8">
                            Connect your external accounts to sync data and enable additional features.
                        </p>

                        <div className="space-y-4">
                            {/* Google Integration Card */}
                            <div className="flex items-start justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex space-x-4">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Mail className="text-red-500" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Google Inbox</h3>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Sync emails and send messages directly from the CRM.
                                        </p>
                                        <div className="mt-3 flex items-center">
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

                            {/* Placeholder for other integrations */}
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
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
