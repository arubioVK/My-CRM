import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import FilterBuilder from '../components/CRM/FilterBuilder';
import { Filter, X, ChevronLeft, ChevronRight, GripVertical, ArrowUp, ArrowDown, Settings } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ALL_COLUMNS = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'address', label: 'Address' },
];

const ClientsPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [views, setViews] = useState([]);
    const [currentViewId, setCurrentViewId] = useState(null);
    const [showFilterBuilder, setShowFilterBuilder] = useState(false);
    const [activeFilters, setActiveFilters] = useState(null);
    const [editingView, setEditingView] = useState(null);
    const [renamingViewId, setRenamingViewId] = useState(null);
    const [renamingValue, setRenamingValue] = useState('');
    const [columnOrder, setColumnOrder] = useState(['name', 'email', 'phone', 'address']);
    const [sorting, setSorting] = useState({ field: 'name', direction: 'asc' });
    const [showColumnConfig, setShowColumnConfig] = useState(false);

    useEffect(() => {
        fetchViews();
    }, []);

    useEffect(() => {
        fetchClients();
    }, [currentViewId, activeFilters, sorting]);

    useEffect(() => {
        // Load column order and sorting when view changes
        const currentView = views.find(v => v.id === currentViewId);
        if (currentView) {
            if (currentView.column_order && currentView.column_order.length > 0) {
                setColumnOrder(currentView.column_order);
            } else {
                setColumnOrder(['name', 'email', 'phone', 'address']);
            }

            if (currentView.sorting && currentView.sorting.field) {
                setSorting(currentView.sorting);
            } else {
                setSorting({ field: 'name', direction: 'asc' });
            }
        } else {
            setColumnOrder(['name', 'email', 'phone', 'address']);
            setSorting({ field: 'name', direction: 'asc' });
        }
    }, [currentViewId, views]);

    const fetchViews = async () => {
        try {
            const response = await api.get('/crm/saved-views/');
            setViews(response.data);
            // Set default view to "All Clients" if available
            if (!currentViewId && response.data.length > 0) {
                const allClientsView = response.data.find(v => v.name === 'All Clients');
                if (allClientsView) setCurrentViewId(allClientsView.id);
            }
        } catch (error) {
            console.error('Error fetching views:', error);
        }
    };

    const fetchClients = async () => {
        try {
            let params = {};
            if (activeFilters) {
                params.filters = JSON.stringify(activeFilters);
            } else if (currentViewId) {
                params.view_id = currentViewId;
            }

            params.sort = JSON.stringify(sorting);

            const response = await api.get('/crm/clients/', { params });
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleApplyFilters = (filters) => {
        setActiveFilters(filters);
        setCurrentViewId(null); // Clear active view when custom filters are applied
        setShowFilterBuilder(false);
    };

    const handleSaveView = async (name, filters, id = null) => {
        try {
            const payload = { filters };
            if (name) payload.name = name;

            if (id) {
                const response = await api.patch(`/crm/saved-views/${id}/`, payload);
                setViews(views.map(v => v.id === id ? response.data : v));
                setEditingView(null);
            } else {
                if (!name) return alert('Please enter a view name');
                const response = await api.post('/crm/saved-views/', payload);
                setViews([...views, response.data]);
                setCurrentViewId(response.data.id);
            }
            setActiveFilters(null);
            setShowFilterBuilder(false);
        } catch (error) {
            console.error('Error saving view:', error);
            alert(error.response?.data?.error || 'Error saving view. Please try again.');
        }
    };

    const handleMoveView = async (id, direction) => {
        const index = views.findIndex(v => v.id === id);
        if (index === -1) return;

        const newViews = [...views];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= views.length) return;

        // Swap
        const temp = newViews[index];
        newViews[index] = newViews[targetIndex];
        newViews[targetIndex] = temp;

        await updateViewPositions(newViews);
    };

    const updateViewPositions = async (newViews) => {
        try {
            // Update positions in backend
            await Promise.all(newViews.map((v, i) =>
                api.patch(`/crm/saved-views/${v.id}/`, { position: i })
            ));
            setViews(newViews.map((v, i) => ({ ...v, position: i })));
        } catch (error) {
            console.error('Error reordering views:', error);
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(views);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        updateViewPositions(items);
    };

    const handleRename = async (id) => {
        if (!renamingValue.trim()) {
            setRenamingViewId(null);
            return;
        }
        try {
            const response = await api.patch(`/crm/saved-views/${id}/`, { name: renamingValue });
            setViews(views.map(v => v.id === id ? response.data : v));
            setRenamingViewId(null);
        } catch (error) {
            console.error('Error renaming view:', error);
            alert('Error renaming view');
        }
    };

    const handleColumnReorder = async (result) => {
        if (!result.destination) return;

        const newColumnOrder = Array.from(columnOrder);
        const [reorderedColumn] = newColumnOrder.splice(result.source.index, 1);
        newColumnOrder.splice(result.destination.index, 0, reorderedColumn);

        setColumnOrder(newColumnOrder);

        // Save to backend if a view is selected
        if (currentViewId) {
            try {
                await api.patch(`/crm/saved-views/${currentViewId}/`, { column_order: newColumnOrder });
                setViews(views.map(v => v.id === currentViewId ? { ...v, column_order: newColumnOrder } : v));
            } catch (error) {
                console.error('Error saving column order:', error);
            }
        }
    };

    const toggleColumnVisibility = async (columnId) => {
        let newColumnOrder;
        if (columnOrder.includes(columnId)) {
            newColumnOrder = columnOrder.filter(id => id !== columnId);
        } else {
            // Add to the end
            newColumnOrder = [...columnOrder, columnId];
        }

        setColumnOrder(newColumnOrder);

        if (currentViewId) {
            try {
                await api.patch(`/crm/saved-views/${currentViewId}/`, { column_order: newColumnOrder });
                setViews(views.map(v => v.id === currentViewId ? { ...v, column_order: newColumnOrder } : v));
            } catch (error) {
                console.error('Error saving column visibility:', error);
            }
        }
    };

    const handleSort = async (field) => {
        const newDirection = sorting.field === field && sorting.direction === 'asc' ? 'desc' : 'asc';
        const newSorting = { field, direction: newDirection };
        setSorting(newSorting);

        // Save to backend if a view is selected
        if (currentViewId) {
            try {
                await api.patch(`/crm/saved-views/${currentViewId}/`, { sorting: newSorting });
                setViews(views.map(v => v.id === currentViewId ? { ...v, sorting: newSorting } : v));
            } catch (error) {
                console.error('Error saving sorting:', error);
            }
        }
    };

    const handleDeleteView = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this view?')) return;
        try {
            await api.delete(`/crm/saved-views/${id}/`);
            setViews(views.filter(v => v.id !== id));
            if (currentViewId === id) {
                const allClientsView = views.find(v => v.name === 'All Clients');
                setCurrentViewId(allClientsView ? allClientsView.id : null);
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Error deleting view');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Clients</h1>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowFilterBuilder(!showFilterBuilder)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${showFilterBuilder || activeFilters
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Filter size={16} className="mr-2" />
                        {activeFilters ? 'Filters Applied' : 'Filter'}
                    </button>
                    <button
                        onClick={() => setShowColumnConfig(!showColumnConfig)}
                        className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${showColumnConfig
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <Settings size={16} className="mr-2" />
                        Columns
                    </button>
                </div>
            </div>

            {/* View Tabs */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="views" direction="horizontal">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="flex items-center space-x-1 mb-6 border-b border-gray-200 overflow-x-auto"
                        >
                            {views.map((view, index) => (
                                <Draggable key={view.id} draggableId={view.id.toString()} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => {
                                                if (renamingViewId !== view.id) {
                                                    setCurrentViewId(view.id);
                                                    setActiveFilters(null);
                                                    setEditingView(null);
                                                }
                                            }}
                                            onDoubleClick={() => {
                                                if (!view.is_system) {
                                                    setRenamingViewId(view.id);
                                                    setRenamingValue(view.name);
                                                }
                                            }}
                                            className={`group flex items-center px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap border-b-2 transition-colors ${currentViewId === view.id && !activeFilters
                                                ? 'border-indigo-500 text-indigo-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            {renamingViewId === view.id ? (
                                                <input
                                                    autoFocus
                                                    value={renamingValue}
                                                    onChange={(e) => setRenamingValue(e.target.value)}
                                                    onBlur={() => handleRename(view.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleRename(view.id);
                                                        if (e.key === 'Escape') setRenamingViewId(null);
                                                    }}
                                                    className="bg-white border border-indigo-300 rounded px-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            ) : (
                                                <>
                                                    <GripVertical size={14} className="mr-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    {view.name}
                                                    {!view.is_system && (
                                                        <div className="ml-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => handleDeleteView(e, view.id)}
                                                                className="text-gray-400 hover:text-red-500"
                                                                title="Delete View"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {showFilterBuilder && (
                <FilterBuilder
                    onApply={handleApplyFilters}
                    onSave={handleSaveView}
                    onClose={() => {
                        setShowFilterBuilder(false);
                        setEditingView(null);
                    }}
                    initialFilters={activeFilters || views.find(v => v.id === currentViewId)?.filters}
                    initialView={editingView}
                    currentViewId={currentViewId}
                    isSystemView={views.find(v => v.id === currentViewId)?.is_system}
                />
            )}

            {showColumnConfig && (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Manage Columns</h3>
                        <button onClick={() => setShowColumnConfig(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Panel: Visibility */}
                        <div className="flex-1 border-r border-gray-100 pr-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Available Columns</h4>
                            <div className="space-y-2">
                                {ALL_COLUMNS.map(col => (
                                    <label key={col.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={columnOrder.includes(col.id)}
                                            onChange={() => toggleColumnVisibility(col.id)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        />
                                        <span className="text-sm text-gray-700">{col.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Reordering */}
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Visible Order (Drag to reorder)</h4>
                            <DragDropContext onDragEnd={handleColumnReorder}>
                                <Droppable droppableId="column-config">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                            {columnOrder.map((colId, index) => {
                                                const col = ALL_COLUMNS.find(c => c.id === colId);
                                                return (
                                                    <Draggable key={colId} draggableId={colId} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className="flex items-center p-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm"
                                                            >
                                                                <GripVertical size={14} className="mr-2 text-gray-400" />
                                                                {col?.label}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                            {columnOrder.length === 0 && (
                                                <p className="text-sm text-gray-400 italic">No columns selected</p>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columnOrder.map((column) => {
                                const col = ALL_COLUMNS.find(c => c.id === column);
                                return (
                                    <th
                                        key={column}
                                        onClick={() => handleSort(column)}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="flex items-center">
                                            {col?.label}
                                            <span className="ml-1">
                                                {sorting.field === column ? (
                                                    sorting.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                ) : (
                                                    <ArrowUp size={12} className="opacity-0 group-hover:opacity-50" />
                                                )}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clients.length > 0 ? (
                            clients.map((client) => (
                                <tr
                                    key={client.id}
                                    onDoubleClick={() => navigate(`/clients/${client.id}`)}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    title="Double click to view details"
                                >
                                    {columnOrder.map((column) => (
                                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {column === 'name' ? (
                                                <span className="font-medium text-gray-900">{client.name}</span>
                                            ) : (
                                                client[column]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columnOrder.length} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No clients found matching these criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientsPage;
