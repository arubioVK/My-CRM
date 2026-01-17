import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, Save, Plus, Trash2, Check, Filter } from 'lucide-react';
import FilterBuilder from '../../components/CRM/FilterBuilder';

const TRIGGER_TYPES = [
    { value: 'CLIENT_CREATED', label: 'Client Created' },
    // Add more triggers
];

const ACTION_TYPES = [
    { value: 'CREATE_TASK', label: 'Create Task' },
    { value: 'SEND_EMAIL', label: 'Send Email' },
    // Add more actions
];

const ALL_CLIENT_COLUMNS = [
    { id: 'name', label: 'Name', type: 'string' },
    { id: 'email', label: 'Email', type: 'string' },
    { id: 'phone', label: 'Phone', type: 'string' },
    { id: 'address', label: 'Address', type: 'string' },
    { id: 'created_at', label: 'Created At', type: 'date' },
    { id: 'updated_at', label: 'Updated At', type: 'date' },
    { id: 'owner', label: 'Owner', type: 'user' },
];

const WorkflowBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [triggerType, setTriggerType] = useState('CLIENT_CREATED');
    const [actionType, setActionType] = useState('CREATE_TASK');
    const [actionConfig, setActionConfig] = useState({});
    const [isActive, setIsActive] = useState(true);
    const [loading, setLoading] = useState(false);

    // Filters State
    const [filters, setFilters] = useState(null);
    const [showFilterBuilder, setShowFilterBuilder] = useState(false);

    const [triggerMode, setTriggerMode] = useState('ALL'); // 'ALL' or 'CONDITION'

    const [matchCount, setMatchCount] = useState(null);

    // Email templates data
    const [emailTemplates, setEmailTemplates] = useState([]);

    useEffect(() => {
        if (!isNew) {
            fetchWorkflow();
        }
        fetchEmailTemplates();
    }, [id]);

    const fetchMatchCount = async (filtersToCheck) => {
        if (!filtersToCheck || Object.keys(filtersToCheck).length === 0) {
            setMatchCount(null);
            return;
        }
        try {
            const response = await api.post('/crm/workflows/preview_count/', { filters: filtersToCheck });
            setMatchCount(response.data.count);
        } catch (error) {
            console.error('Error fetching match count:', error);
            setMatchCount(null);
        }
    };

    const fetchWorkflow = async () => {
        try {
            const response = await api.get(`/crm/workflows/${id}/`);
            const data = response.data;
            setName(data.name);
            setDescription(data.description);
            setTriggerType(data.trigger_type);
            setActionType(data.action_type);
            setActionConfig(data.action_config);
            setIsActive(data.is_active);
            setFilters(data.filters);

            // Determine initial mode based on filters
            if (data.filters && Object.keys(data.filters).length > 0) {
                setTriggerMode('CONDITION');
                fetchMatchCount(data.filters);
            } else {
                setTriggerMode('ALL');
            }
        } catch (error) {
            console.error('Error fetching workflow:', error);
            alert('Error fetching workflow data');
        }
    };

    const fetchEmailTemplates = async () => {
        try {
            const response = await api.get('/crm/email-templates/');
            setEmailTemplates(response.data);
        } catch (error) {
            console.error('Error fetching email templates:', error);
        }
    };

    const handleSave = async () => {
        if (!name) return alert('Please enter a workflow name');

        // Validation: If Condition mode is selected but no filters, warn user or set to ALL?
        // Let's just save. If no filters, it runs for all, which is technical truth, though maybe UX warning is better.
        // For now, simple save.

        setLoading(true);
        const payload = {
            name,
            description,
            trigger_type: triggerType,
            action_type: actionType,
            action_config: actionConfig,
            is_active: isActive,
            filters: (triggerMode === 'CONDITION' ? filters : {}) || {}
        };

        try {
            if (isNew) {
                await api.post('/crm/workflows/', payload);
            } else {
                await api.put(`/crm/workflows/${id}/`, payload);
            }
            navigate('/automations/workflows');
        } catch (error) {
            console.error('Error saving workflow:', error);
            alert('Error saving workflow');
        } finally {
            setLoading(false);
        }
    };

    const renderActionConfig = () => {
        if (actionType === 'CREATE_TASK') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Task Title</label>
                        <input
                            type="text"
                            value={actionConfig.task_title || ''}
                            onChange={(e) => setActionConfig({ ...actionConfig, task_title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            placeholder="e.g. Follow up with new client"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={actionConfig.task_description || ''}
                            onChange={(e) => setActionConfig({ ...actionConfig, task_description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due In (Days)</label>
                        <input
                            type="number"
                            value={actionConfig.due_days || 0}
                            onChange={(e) => setActionConfig({ ...actionConfig, due_days: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        />
                    </div>
                </div>
            );
        } else if (actionType === 'SEND_EMAIL') {
            return (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Template</label>
                        <select
                            value={actionConfig.template_id || ''}
                            onChange={(e) => setActionConfig({ ...actionConfig, template_id: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        >
                            <option value="">Select a template</option>
                            {emailTemplates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                            Select the email template to send. Ensure your Google account is connected.
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/automations/workflows')}
                className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={20} className="mr-2" />
                Back to Workflows
            </button>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h1 className="text-2xl font-bold text-gray-800">{isNew ? 'New Workflow' : 'Edit Workflow'}</h1>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={isActive}
                                    onChange={() => setIsActive(!isActive)}
                                />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isActive ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-700">{isActive ? 'Active' : 'Inactive'}</span>
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className={`flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            <Save size={18} className="mr-2" />
                            {loading ? 'Saving...' : 'Save Workflow'}
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                placeholder="e.g. New Client Welcome Sequence"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                                rows={2}
                                placeholder="Describe what this workflow does..."
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Steps</h3>

                        <div className="relative pl-8 pb-8 border-l-2 border-indigo-200">
                            <div className="absolute -left-2.5 top-0 bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center border-4 border-white">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                            </div>
                            <div className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step 1: Trigger</span>
                                        <h4 className="text-lg font-medium text-gray-900 mt-1">When should this run?</h4>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => {
                                                setTriggerType('CLIENT_CREATED');
                                                setTriggerMode('ALL');
                                            }}
                                            className={`p-4 border rounded-lg text-left transition-all ${triggerMode === 'ALL'
                                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="font-medium text-gray-900">Client Created</div>
                                            <div className="text-sm text-gray-500 mt-1">Run for every new client</div>
                                        </button>

                                        <button
                                            onClick={() => {
                                                setTriggerType('CLIENT_CREATED');
                                                setTriggerMode('CONDITION');
                                                if (!filters || Object.keys(filters).length === 0) {
                                                    setShowFilterBuilder(true);
                                                }
                                            }}
                                            className={`p-4 border rounded-lg text-left transition-all relative ${triggerMode === 'CONDITION'
                                                ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {filters && Object.keys(filters).length > 0 && triggerMode === 'CONDITION' && (
                                                <div className="absolute top-2 right-2 text-indigo-600">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                            <div className="font-medium text-gray-900">Condition</div>
                                            <div className="text-sm text-gray-500 mt-1">Run only when specific conditions are met</div>
                                        </button>
                                    </div>

                                    {/* Show Filter Status/Edit if Condition is Active */}
                                    {triggerMode === 'CONDITION' && (
                                        <div className="mt-4 bg-white border border-indigo-100 rounded-md p-4">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center text-sm">
                                                    {filters && Object.keys(filters).length > 0 ? (
                                                        <div className="flex items-center space-x-3">
                                                            <div className="flex items-center text-green-600">
                                                                <Check size={16} className="mr-1" />
                                                                <span>Filters active</span>
                                                            </div>
                                                            {matchCount !== null && (
                                                                <>
                                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                                        Matches {matchCount} existing clients
                                                                    </span>
                                                                    {!isNew && matchCount > 0 && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (window.confirm(`Are you sure you want to run this workflow for ${matchCount} existing clients? This will execute the action (e.g. create tasks) for all of them.`)) {
                                                                                    try {
                                                                                        setLoading(true);
                                                                                        const res = await api.post(`/crm/workflows/${id}/run_matches/`, {
                                                                                            filters,
                                                                                            action_config: actionConfig,
                                                                                            action_type: actionType
                                                                                        });
                                                                                        alert(res.data.message);
                                                                                    } catch (err) {
                                                                                        console.error(err);
                                                                                        alert('Error running workflow');
                                                                                    } finally {
                                                                                        setLoading(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 border border-indigo-200 transition-colors"
                                                                            type="button"
                                                                        >
                                                                            Run for matches
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500 italic">No filters applied (runs for all)</span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => setShowFilterBuilder(true)}
                                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
                                                >
                                                    {filters && Object.keys(filters).length > 0 ? 'Edit Filters' : 'Add Filters'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Action */}
                        <div className="relative pl-8">
                            <div className="absolute -left-2.5 top-0 bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center border-4 border-white">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                            </div>
                            <div className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step 3: Action</span>
                                        <h4 className="text-lg font-medium text-gray-900 mt-1">Then do this...</h4>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <select
                                        value={actionType}
                                        onChange={(e) => setActionType(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border bg-gray-50"
                                    >
                                        {ACTION_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    {renderActionConfig()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showFilterBuilder && (
                <FilterBuilder
                    onApply={(newFilters) => {
                        setFilters(newFilters);
                        setShowFilterBuilder(false);
                        fetchMatchCount(newFilters);
                    }}
                    onClose={() => setShowFilterBuilder(false)}
                    initialFilters={filters}
                    fields={[...ALL_CLIENT_COLUMNS].map(c => ({ label: c.label, value: c.id, type: c.type, options: c.options }))}
                    defaultField="name"
                    hideSaveView={true} // Only for logical filtering, not saved views
                />
            )}
        </div>
    );
};

export default WorkflowBuilder;
