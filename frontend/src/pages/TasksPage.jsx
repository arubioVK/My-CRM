import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import FilterBuilder from '../components/CRM/FilterBuilder';
import ExportButton from '../components/CRM/ExportButton';
import { Filter, X, ChevronLeft, ChevronRight, GripVertical, ArrowUp, ArrowDown, Settings, CheckSquare, Search } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const ALL_COLUMNS = [
    { id: 'completed', label: 'Done', type: 'boolean' },
    { id: 'title', label: 'Title', type: 'string' },
    {
        id: 'status', label: 'Status', type: 'select', options: [
            { label: 'To Do', value: 'todo' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Done', value: 'done' },
        ]
    },
    {
        id: 'priority', label: 'Priority', type: 'select', options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
        ]
    },
    { id: 'due_date', label: 'Due Date', type: 'date' },
    { id: 'client_name', label: 'Client', type: 'string' },
    { id: 'assigned_to_name', label: 'Assigned To', type: 'string' },
    { id: 'created_at', label: 'Created At', type: 'date' },
    { id: 'updated_at', label: 'Updated At', type: 'date' },
    { id: 'completed_at', label: 'Completed At', type: 'date' },
];

const TasksPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [tasks, setTasks] = useState([]);
    const [views, setViews] = useState([]);
    const [currentViewId, setCurrentViewId] = useState(null);
    const [showFilterBuilder, setShowFilterBuilder] = useState(false);
    const [activeFilters, setActiveFilters] = useState(null);
    const [editingView, setEditingView] = useState(null);
    const [renamingViewId, setRenamingViewId] = useState(null);
    const [renamingValue, setRenamingValue] = useState('');
    const [columnOrder, setColumnOrder] = useState(['completed', 'title', 'status', 'priority', 'due_date', 'client_name']);
    const [sorting, setSorting] = useState({ field: 'due_date', direction: 'asc' });
    const [showColumnConfig, setShowColumnConfig] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    const lastRequestRef = React.useRef('');
    const viewsFetchedRef = React.useRef(false);

    useEffect(() => {
        if (viewsFetchedRef.current) return;
        viewsFetchedRef.current = true;
        fetchViews();
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchTasks(controller.signal);
        return () => controller.abort();
    }, [currentViewId, activeFilters, sorting, currentPage, pageSize, refreshTrigger, searchTerm]);

    useEffect(() => {
        const clientId = searchParams.get('client_id');
        if (clientId) {
            setActiveFilters({
                logic: 'AND',
                conditions: [{ field: 'client', operator: 'exact', value: clientId }]
            });
            setCurrentViewId(null);
            setCurrentPage(1);
        }
    }, [searchParams]);

    const handleSelectView = (viewId, viewsList = views) => {
        const view = viewsList.find(v => v.id === viewId);
        if (view) {
            setColumnOrder(view.column_order && view.column_order.length > 0 ? view.column_order : ['completed', 'title', 'status', 'priority', 'due_date', 'client_name']);
            setSorting(view.sorting && view.sorting.field ? view.sorting : { field: 'due_date', direction: 'asc' });
            setCurrentViewId(viewId);
            setActiveFilters(null);
            setEditingView(null);
            setCurrentPage(1);
        } else {
            setColumnOrder(['completed', 'title', 'status', 'priority', 'due_date', 'client_name']);
            setSorting({ field: 'due_date', direction: 'asc' });
            setCurrentViewId(viewId);
            setCurrentPage(1);
        }
    };

    const fetchViews = async () => {
        try {
            const response = await api.get('/crm/saved-views/', { params: { view_type: 'task' } });
            const viewsData = response.data;
            setViews(viewsData);
            // Only set default view if no client_id is present in URL
            if (!currentViewId && viewsData.length > 0 && !searchParams.get('client_id')) {
                handleSelectView(viewsData[0].id, viewsData);
            }
        } catch (error) {
            console.error('Error fetching views:', error);
        }
    };

    const fetchTasks = async (signal) => {
        const params = {
            sort: JSON.stringify(sorting),
            page: currentPage,
            page_size: pageSize,
            search: searchTerm
        };

        if (activeFilters) {
            params.filters = JSON.stringify(activeFilters);
        } else if (currentViewId) {
            params.view_id = currentViewId;
        }

        const signature = JSON.stringify(params);
        if (signature === lastRequestRef.current) return;
        lastRequestRef.current = signature;

        try {
            const response = await api.get('/crm/tasks/', {
                params,
                signal
            });
            if (response.data.results) {
                setTasks(response.data.results);
                setTotalItems(response.data.count);
                setTotalPages(Math.ceil(response.data.count / pageSize));
            } else {
                setTasks(response.data);
                setTotalItems(response.data.length);
                setTotalPages(1);
            }
        } catch (error) {
            if (error.name === 'CanceledError') return;
            console.error('Error fetching tasks:', error);
        }
    };

    const handleToggleDone = async (e, task) => {
        e.stopPropagation();
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        try {
            const response = await api.patch(`/crm/tasks/${task.id}/`, { status: newStatus });
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: response.data.status } : t));
        } catch (error) {
            console.error('Error toggling task status:', error);
            alert('Error updating task status');
        }
    };

    const handleApplyFilters = (filters) => {
        setActiveFilters(filters);
        setCurrentViewId(null);
        setShowFilterBuilder(false);
        setCurrentPage(1);
    };

    const handleSaveView = async (name, filters, id = null) => {
        try {
            const payload = { filters, view_type: 'task' };
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
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Error saving view:', error);
            alert(error.response?.data?.error || 'Error saving view. Please try again.');
        }
    };

    const updateViewPositions = async (newViews) => {
        try {
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
                const remainingViews = views.filter(v => v.id !== id);
                setCurrentViewId(remainingViews.length > 0 ? remainingViews[0].id : null);
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Error deleting view');
        }
    };

    return (
        <div>
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800">Tasks</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Showing <span className="font-semibold text-gray-900">{tasks.length}</span> of <span className="font-semibold text-gray-900">{totalItems}</span> tasks
                </p>
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
                                                    handleSelectView(view.id);
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

            <div className="mb-6 flex justify-between items-center">
                <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search by title..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <X size={14} className="text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    <ExportButton
                        endpoint="/crm/tasks/"
                        filters={activeFilters || views.find(v => v.id === currentViewId)?.filters}
                        sort={sorting}
                        columns={columnOrder}
                        filename="tasks_export"
                    />
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
                    fields={[
                        { label: 'Title', value: 'title', type: 'string' },
                        {
                            label: 'Status', value: 'status', type: 'select', options: [
                                { label: 'To Do', value: 'todo' },
                                { label: 'In Progress', value: 'in_progress' },
                                { label: 'Done', value: 'done' },
                            ]
                        },
                        {
                            label: 'Priority', value: 'priority', type: 'select', options: [
                                { label: 'Low', value: 'low' },
                                { label: 'Medium', value: 'medium' },
                                { label: 'High', value: 'high' },
                            ]
                        },
                        { label: 'Due Date', value: 'due_date', type: 'date' },
                        { label: 'Completed At', value: 'completed_at', type: 'date' },
                        { label: 'Client', value: 'client', type: 'string' },
                        { label: 'Assigned To', value: 'assigned_to', type: 'user' },
                        { label: 'Created At', value: 'created_at', type: 'date' },
                        { label: 'Updated At', value: 'updated_at', type: 'date' },
                    ]}
                    defaultField="title"
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
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Visible Order</h4>
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
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <tr
                                    key={task.id}
                                    onClick={() => navigate(`/tasks/${task.id}`)}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    {columnOrder.map((column) => (
                                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {column === 'completed' ? (
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={task.status === 'done'}
                                                        onChange={(e) => handleToggleDone(e, task)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                                    />
                                                </div>
                                            ) : column === 'title' ? (
                                                <span className="font-medium text-gray-900">{task.title}</span>
                                            ) : column === 'client_name' ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/clients/${task.client}`);
                                                    }}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline text-left"
                                                >
                                                    {task.client_name}
                                                </button>
                                            ) : column === 'status' ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === 'done' ? 'bg-green-100 text-green-800' :
                                                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            ) : column === 'priority' ? (
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            ) : column === 'due_date' || column === 'completed_at' || column === 'created_at' || column === 'updated_at' ? (
                                                task[column] ? new Date(task[column]).toLocaleDateString() : '-'
                                            ) : (
                                                task[column]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columnOrder.length} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex justify-center items-center">
                <div className="flex items-center space-x-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md transition-colors ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-medium text-gray-700">
                        Page <span className="text-indigo-600">{currentPage}</span> of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md transition-colors ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TasksPage;
