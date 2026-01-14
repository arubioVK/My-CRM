import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileText, Table as TableIcon } from 'lucide-react';
import api from '../../api';

const ExportButton = ({ endpoint, filters, sort, columns, filename = 'export' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExport = async (format) => {
        setExporting(true);
        setIsOpen(false);
        try {
            const params = {
                format,
                filters: filters ? JSON.stringify(filters) : undefined,
                sort: sort ? JSON.stringify(sort) : undefined,
                columns: columns ? JSON.stringify(columns) : undefined,
            };

            // endpoint is like "/crm/clients/" or "/crm/tasks/"
            // We want "/crm/export/clients/" or "/crm/export/tasks/"
            const type = endpoint.includes('clients') ? 'clients' : 'tasks';
            const exportUrl = `/crm/export/${type}/`;

            const response = await api.get(exportUrl, {
                params,
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${filename}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting data. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={exporting}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50`}
            >
                {exporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                ) : (
                    <Download size={16} className="mr-2" />
                )}
                Export
                <ChevronDown size={14} className={`ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50 py-1">
                    <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FileText size={14} className="mr-3 text-gray-400" />
                        CSV (.csv)
                    </button>
                    <button
                        onClick={() => handleExport('xlsx')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <TableIcon size={14} className="mr-3 text-gray-400" />
                        Excel (.xlsx)
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportButton;
