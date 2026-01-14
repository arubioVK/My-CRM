import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Save, X, RefreshCw, ChevronDown } from 'lucide-react';

const OPERATORS_BY_TYPE = {
    string: [
        { label: 'Contains', value: 'icontains' },
        { label: 'Equals', value: 'exact' },
        { label: 'Starts with', value: 'istartswith' },
        { label: 'Ends with', value: 'iendswith' },
        { label: 'Is Set', value: 'isnull', valueOverride: false },
        { label: 'Is Not Set', value: 'isnull', valueOverride: true },
    ],
    number: [
        { label: 'Equals', value: 'exact' },
        { label: 'Greater than', value: 'gt' },
        { label: 'Greater or equal', value: 'gte' },
        { label: 'Less than', value: 'lt' },
        { label: 'Less or equal', value: 'lte' },
        { label: 'Is Set', value: 'isnull', valueOverride: false },
        { label: 'Is Not Set', value: 'isnull', valueOverride: true },
    ],
    date: [
        { label: 'Equals', value: 'exact' },
        { label: 'After', value: 'gt' },
        { label: 'Before', value: 'lt' },
        { label: 'Today', value: 'today', valueOverride: 'today' },
        { label: 'Yesterday', value: 'yesterday', valueOverride: 'yesterday' },
        { label: 'Tomorrow', value: 'tomorrow', valueOverride: 'tomorrow' },
        { label: 'After Today', value: 'after_today', valueOverride: 'after_today' },
        { label: 'Before Today', value: 'before_today', valueOverride: 'before_today' },
        { label: 'Within Last N Days', value: 'past_n_days' },
        { label: 'Within Next N Days', value: 'future_n_days' },
        { label: 'Between', value: 'between' },
        { label: 'Is Set', value: 'isnull', valueOverride: false },
        { label: 'Is Not Set', value: 'isnull', valueOverride: true },
    ],
    select: [
        { label: 'In', value: 'in' },
        { label: 'Equals', value: 'exact' },
        { label: 'Is Set', value: 'isnull', valueOverride: false },
        { label: 'Is Not Set', value: 'isnull', valueOverride: true },
    ],
    user: [
        { label: 'In', value: 'in' },
        { label: 'Equals', value: 'exact' },
    ]
};

const DEFAULT_OPERATORS = OPERATORS_BY_TYPE.string;

const FilterBuilder = ({
    onApply,
    onSave,
    onClose,
    initialFilters,
    initialView,
    currentViewId,
    isSystemView,
    fields = [],
    defaultField = 'name'
}) => {
    const [filterData, setFilterData] = useState(() => {
        const rawFilters = initialView?.filters || initialFilters;

        const ensureIds = (group) => ({
            id: group.id || Math.random().toString(36).substr(2, 9),
            logic: group.logic || 'AND',
            conditions: (group.conditions || []).map(c =>
                c.logic ? ensureIds(c) : { ...c, id: c.id || Math.random().toString(36).substr(2, 9) }
            )
        });

        if (rawFilters && rawFilters.conditions) return ensureIds(rawFilters);

        return {
            id: Math.random().toString(36).substr(2, 9),
            logic: 'AND',
            conditions: [{ id: Math.random().toString(36).substr(2, 9), field: defaultField, operator: 'icontains', value: '' }]
        };
    });

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

    const updateGroup = (groupId, updater) => {
        const findAndReplace = (group) => {
            if (group.id === groupId) return updater(group);
            return {
                ...group,
                conditions: group.conditions.map(c => c.logic ? findAndReplace(c) : c)
            };
        };
        setFilterData(findAndReplace(filterData));
    };

    const addCondition = (groupId) => {
        const firstField = fields[0];
        const type = firstField?.type || 'string';
        const defaultOp = OPERATORS_BY_TYPE[type]?.[0]?.value || 'icontains';

        updateGroup(groupId, (group) => ({
            ...group,
            conditions: [...group.conditions, {
                id: Math.random().toString(36).substr(2, 9),
                field: defaultField,
                operator: defaultOp,
                value: ''
            }]
        }));
    };

    const addGroup = (groupId) => {
        updateGroup(groupId, (group) => ({
            ...group,
            conditions: [...group.conditions, {
                id: Math.random().toString(36).substr(2, 9),
                logic: 'AND',
                conditions: [{
                    id: Math.random().toString(36).substr(2, 9),
                    field: defaultField,
                    operator: 'icontains',
                    value: ''
                }]
            }]
        }));
    };

    const removeCondition = (groupId, condId) => {
        updateGroup(groupId, (group) => {
            if (group.conditions.length === 1 && groupId === filterData.id) return group;
            return {
                ...group,
                conditions: group.conditions.filter(c => c.id !== condId)
            };
        });
    };

    const updateCondition = (groupId, condId, key, val) => {
        updateGroup(groupId, (group) => ({
            ...group,
            conditions: group.conditions.map(c => {
                if (c.id !== condId) return c;
                const newC = { ...c, [key]: val };
                if (key === 'field') {
                    const fieldDef = fields.find(f => f.value === val);
                    const type = fieldDef?.type || 'string';
                    const operators = OPERATORS_BY_TYPE[type] || DEFAULT_OPERATORS;
                    newC.operator = operators[0].value;
                    if (type === 'select' || type === 'user') {
                        newC.value = [];
                    } else if (operators[0].value === 'between') {
                        newC.value = ['', ''];
                    } else {
                        newC.value = '';
                    }
                }
                return newC;
            })
        }));
    };

    const handleApply = () => {
        onApply(filterData);
    };

    const handleSave = () => {
        if (!viewName) return alert('Please enter a view name');
        onSave(viewName, filterData, initialView?.id);
        if (!initialView) setViewName('');
        setShowSave(false);
    };

    const renderGroup = (group, isRoot = false) => {
        return (
            <div key={group.id} className={`${isRoot ? '' : 'ml-6 pl-4 border-l-2 border-indigo-100 my-4'} space-y-3`}>
                <div className="flex items-center space-x-4 mb-2">
                    <span className="text-sm font-medium text-gray-700">Match</span>
                    <select
                        value={group.logic}
                        onChange={(e) => updateGroup(group.id, (g) => ({ ...g, logic: e.target.value }))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="AND">All (AND)</option>
                        <option value="OR">Any (OR)</option>
                    </select>
                    <span className="text-sm font-medium text-gray-700">of the following:</span>
                    {!isRoot && (
                        <button
                            onClick={() => {
                                const findParentAndRemove = (current) => {
                                    return {
                                        ...current,
                                        conditions: current.conditions.filter(c => c.id !== group.id).map(c => c.logic ? findParentAndRemove(c) : c)
                                    };
                                };
                                setFilterData(findParentAndRemove(filterData));
                            }}
                            className="text-red-400 hover:text-red-600 p-1"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    {group.conditions.map((cond) => {
                        if (cond.logic) return renderGroup(cond);

                        const fieldDef = fields.find(f => f.value === cond.field);
                        const type = fieldDef?.type || 'string';
                        const operators = OPERATORS_BY_TYPE[type] || DEFAULT_OPERATORS;

                        return (
                            <div key={cond.id} className="flex items-center space-x-3">
                                <select
                                    value={cond.field}
                                    onChange={(e) => updateCondition(group.id, cond.id, 'field', e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                >
                                    {fields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>

                                <select
                                    value={cond.operator}
                                    onChange={(e) => {
                                        const opIndex = e.target.selectedIndex;
                                        const opDef = operators[opIndex];
                                        updateGroup(group.id, (g) => ({
                                            ...g,
                                            conditions: g.conditions.map(c => {
                                                if (c.id !== cond.id) return c;
                                                const newC = { ...c, operator: opDef.value };
                                                if (opDef.valueOverride !== undefined) {
                                                    newC.value = opDef.valueOverride;
                                                } else if (opDef.value === 'between') {
                                                    newC.value = ['', ''];
                                                } else if (['past_n_days', 'future_n_days'].includes(opDef.value)) {
                                                    newC.value = '15';
                                                }
                                                return newC;
                                            })
                                        }));
                                    }}
                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                >
                                    {operators.map((o, i) => (
                                        <option key={i} value={o.value}>{o.label}</option>
                                    ))}
                                </select>

                                {(() => {
                                    const currentOpDef = operators.find(o => o.value === cond.operator);
                                    if (currentOpDef?.valueOverride !== undefined) {
                                        return <div className="flex-2 py-2 text-sm text-gray-400 italic">No value needed</div>;
                                    }

                                    if (type === 'user') {
                                        return (
                                            <details className="flex-2 relative group">
                                                <summary className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white cursor-pointer list-none">
                                                    <span className="truncate">
                                                        {Array.isArray(cond.value) && cond.value.length > 0
                                                            ? `${cond.value.length} selected`
                                                            : 'Select Users'}
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
                                                                updateCondition(group.id, cond.id, 'value', newVal);
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
                                                                    updateCondition(group.id, cond.id, 'value', newVal);
                                                                }}
                                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm">{u.username}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        );
                                    }

                                    if (type === 'select' && fieldDef.options) {
                                        return (
                                            <details className="flex-2 relative group">
                                                <summary className="flex items-center justify-between border border-gray-300 rounded-md px-3 py-2 text-sm bg-white cursor-pointer list-none">
                                                    <span className="truncate">
                                                        {Array.isArray(cond.value) && cond.value.length > 0
                                                            ? `${cond.value.length} selected`
                                                            : 'Select Options'}
                                                    </span>
                                                    <ChevronDown size={14} className="ml-2 text-gray-400 group-open:rotate-180 transition-transform" />
                                                </summary>
                                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                                                    {fieldDef.options.map(opt => (
                                                        <label key={opt.value} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={Array.isArray(cond.value) && cond.value.includes(opt.value)}
                                                                onChange={(e) => {
                                                                    const currentVal = Array.isArray(cond.value) ? cond.value : [cond.value];
                                                                    const newVal = e.target.checked
                                                                        ? [...currentVal.filter(v => v !== ''), opt.value]
                                                                        : currentVal.filter(v => v !== opt.value);
                                                                    updateCondition(group.id, cond.id, 'value', newVal);
                                                                }}
                                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm">{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </details>
                                        );
                                    }

                                    if (cond.operator === 'between') {
                                        return (
                                            <div className="flex-2 flex items-center space-x-2">
                                                <input
                                                    type="date"
                                                    value={Array.isArray(cond.value) ? cond.value[0] : ''}
                                                    onChange={(e) => {
                                                        const newVal = [...(Array.isArray(cond.value) ? cond.value : ['', ''])];
                                                        newVal[0] = e.target.value;
                                                        updateCondition(group.id, cond.id, 'value', newVal);
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                />
                                                <span className="text-gray-400">and</span>
                                                <input
                                                    type="date"
                                                    value={Array.isArray(cond.value) ? cond.value[1] : ''}
                                                    onChange={(e) => {
                                                        const newVal = [...(Array.isArray(cond.value) ? cond.value : ['', ''])];
                                                        newVal[1] = e.target.value;
                                                        updateCondition(group.id, cond.id, 'value', newVal);
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                />
                                            </div>
                                        );
                                    }

                                    if (['past_n_days', 'future_n_days'].includes(cond.operator)) {
                                        return (
                                            <div className="flex-2 flex items-center space-x-2">
                                                <input
                                                    type="number"
                                                    value={cond.value}
                                                    onChange={(e) => updateCondition(group.id, cond.id, 'value', e.target.value)}
                                                    className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                                />
                                                <span className="text-sm text-gray-500">days</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <input
                                            type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                                            value={cond.value}
                                            onChange={(e) => updateCondition(group.id, cond.id, 'value', e.target.value)}
                                            placeholder="Value"
                                            className="flex-2 border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        />
                                    );
                                })()}

                                <button
                                    onClick={() => removeCondition(group.id, cond.id)}
                                    className="text-red-400 hover:text-red-600 p-2"
                                    disabled={group.conditions.length === 1 && isRoot}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center space-x-4 mt-2">
                    <button
                        onClick={() => addCondition(group.id)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                        <Plus size={14} className="mr-1" /> Add Condition
                    </button>
                    <button
                        onClick={() => addGroup(group.id)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                        <Plus size={14} className="mr-1" /> Add Group
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Filter Builder</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            <div className="mb-6">
                {renderGroup(filterData, true)}
            </div>

            <div className="flex justify-end items-center border-t border-gray-100 pt-4">
                <div className="flex space-x-3">
                    <button
                        onClick={handleApply}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
                    >
                        Apply Filters
                    </button>
                    {currentViewId && !initialView && !isSystemView && (
                        <button
                            onClick={() => onSave(null, filterData, currentViewId)}
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
