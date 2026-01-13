import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Save, X, RefreshCw, ChevronDown } from 'lucide-react';

const FIELDS = [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Address', value: 'address' },
    { label: 'Owner', value: 'owner' },
];

const OPERATORS = [
    { label: 'Equals', value: 'exact' },
    { label: 'Contains', value: 'icontains' },
    { label: 'Starts with', value: 'istartswith' },
    { label: 'Ends with', value: 'iendswith' },
];

const FilterBuilder = ({ onApply, onSave, onClose, initialFilters, initialView, currentViewId, isSystemView }) => {
    const [logic, setLogic] = useState(initialView?.filters?.logic || initialFilters?.logic || 'AND');
    const [conditions, setConditions] = useState(initialView?.filters?.conditions || initialFilters?.conditions || [
        { field: 'name', operator: 'icontains', value: '' }
    ]);
    const [viewName, setViewName] = useState(initialView?.name || '');
    const [showSave, setShowSave] = useState(!!initialView);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/auth/users/');
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        fetchUsers();
    }, []);

    const addCondition = () => {
        setConditions([...conditions, { field: 'name', operator: 'icontains', value: '' }]);
    };

    const removeCondition = (index) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index, key, val) => {
        const newConds = [...conditions];
        newConds[index][key] = val;
        setConditions(newConds);
    };

    const handleApply = () => {
        onApply({ logic, conditions });
    };

    const handleSave = () => {
        if (!viewName) return alert('Please enter a view name');
        onSave(viewName, { logic, conditions }, initialView?.id);
        if (!initialView) setViewName('');
        setShowSave(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Filter Builder</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium text-gray-700">Match</span>
                <select
                    value={logic}
                    onChange={(e) => setLogic(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="AND">All (AND)</option>
                    <option value="OR">Any (OR)</option>
                </select>
                <span className="text-sm font-medium text-gray-700">of the following:</span>
            </div>

            <div className="space-y-3 mb-6">
                {conditions.map((cond, index) => (
                    <div key={index} className="flex items-center space-x-3">
                        <select
                            value={cond.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>

                        <select
                            value={cond.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                        >
                            {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {cond.field === 'owner' ? (
                            <details className="flex-2 relative group">
                                <summary className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white cursor-pointer list-none">
                                    <span className="truncate">
                                        {Array.isArray(cond.value) && cond.value.length > 0
                                            ? `${cond.value.length} selected`
                                            : 'Select Owners'}
                                    </span>
                                    <ChevronDown size={14} className="ml-2 text-gray-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                                    <label className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Array.isArray(cond.value) ? cond.value.includes('me') : cond.value === 'me'}
                                            onChange={(e) => {
                                                const currentVal = Array.isArray(cond.value) ? cond.value : [cond.value];
                                                const newVal = e.target.checked
                                                    ? [...currentVal.filter(v => v !== ''), 'me']
                                                    : currentVal.filter(v => v !== 'me');
                                                updateCondition(index, 'value', newVal);
                                            }}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm">Me</span>
                                    </label>
                                    {users.map(u => (
                                        <label key={u.id} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={Array.isArray(cond.value) && cond.value.includes(u.id)}
                                                onChange={(e) => {
                                                    const currentVal = Array.isArray(cond.value) ? cond.value : [cond.value];
                                                    const newVal = e.target.checked
                                                        ? [...currentVal.filter(v => v !== ''), u.id]
                                                        : currentVal.filter(v => v !== u.id);
                                                    updateCondition(index, 'value', newVal);
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm">{u.username}</span>
                                        </label>
                                    ))}
                                </div>
                            </details>
                        ) : (
                            <input
                                type="text"
                                value={cond.value}
                                onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                placeholder="Value"
                                className="flex-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
                            />
                        )}

                        <button
                            onClick={() => removeCondition(index)}
                            className="text-red-400 hover:text-red-600 p-2"
                            disabled={conditions.length === 1}
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={addCondition}
                    className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                    <Plus size={16} className="mr-1" /> Add Condition
                </button>

                <div className="flex space-x-3">
                    <button
                        onClick={handleApply}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                    >
                        Apply Filters
                    </button>
                    {currentViewId && !initialView && !isSystemView && (
                        <button
                            onClick={() => onSave(null, { logic, conditions }, currentViewId)}
                            className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-200 flex items-center"
                            title="Update current view with these filters"
                        >
                            <RefreshCw size={16} className="mr-2" /> Update Current View
                        </button>
                    )}
                    <button
                        onClick={() => setShowSave(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
                    >
                        <Save size={16} className="mr-2" /> {initialView ? 'Update View' : 'Save as View'}
                    </button>
                </div>
            </div>

            {showSave && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-3">
                    <input
                        type="text"
                        value={viewName}
                        onChange={(e) => setViewName(e.target.value)}
                        placeholder="View Name (e.g. High Priority)"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <button
                        onClick={handleSave}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                    >
                        {initialView ? 'Confirm Update' : 'Confirm Save'}
                    </button>
                    <button
                        onClick={() => setShowSave(false)}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterBuilder;
