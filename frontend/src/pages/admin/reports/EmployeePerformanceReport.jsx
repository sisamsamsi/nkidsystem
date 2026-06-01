import React, { useState, useEffect, useCallback } from 'react';
import { 
    Calendar, Download, FileText, Users, TrendingUp, CheckCircle, 
    Clock, ChevronDown, ChevronUp, Search, Filter, Loader2, AlertCircle,
    User
} from 'lucide-react';
import { reportService } from '../../../services/reportService';

const EmployeePerformanceReport = () => {
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState({
        total_employees: 0,
        active_employees: 0,
        total_output: 0,
        total_logs: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedRows, setExpandedRows] = useState({});
    const [dateRange, setDateRange] = useState('30'); // days

    const handleExportCSV = () => {
        if (employees.length === 0) return;
        
        // CSV Headers
        const headers = ['Employee ID', 'Employee Name', 'Role', 'Total Output (pcs)', 'Logs Count', 'Avg / Day'];
        
        // CSV Rows
        const rows = employees.map(emp => [
            emp.user_id,
            `"${emp.user_name?.replace(/"/g, '""')}"`,
            emp.role || 'Operator',
            emp.total_quantity || 0,
            emp.task_count || 0,
            emp.avg_per_day || 0
        ]);
        
        // Combine into CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');
        
        // Create Blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `employee_performance_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (employees.length === 0) return;
        
        // Guard against popup blockers
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to export PDF.');
            return;
        }

        // HTML escape helper to prevent XSS
        const esc = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        
        const content = `
            <html>
            <head>
                <title>Employee Performance Report</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; color: #333; }
                    h1 { margin-bottom: 5px; }
                    p { margin-top: 0; color: #666; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                    th { background-color: #f5f5f5; }
                    .text-right { text-align: right; }
                </style>
            </head>
            <body>
                <h1>NKids Production — Employee Performance Report</h1>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Employee Name</th>
                            <th>Role</th>
                            <th class="text-right">Total Output</th>
                            <th class="text-right">Logs Count</th>
                            <th class="text-right">Avg / Day</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(emp => `
                            <tr>
                                <td>#${esc(emp.user_id)}</td>
                                <td><strong>${esc(emp.user_name)}</strong></td>
                                <td>${esc(emp.role || 'Operator')}</td>
                                <td class="text-right">${esc(emp.total_quantity?.toLocaleString() || 0)} pcs</td>
                                <td class="text-right">${esc(emp.task_count || 0)}</td>
                                <td class="text-right">${esc(emp.avg_per_day || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                <\/script>
            </body>
            </html>
        `;
        printWindow.document.write(content);
        printWindow.document.close();
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0];
            
            const response = await reportService.getEmployeePerformance({
                start_date: startDate,
                end_date: endDate
            });
            
            // reportService already returns response.data, so response is the API data object directly
            if (response && (response.success !== false)) {
                setEmployees(response.data || []);
                setSummary(response.summary || {
                    total_employees: 0,
                    active_employees: 0,
                    total_output: 0,
                    total_logs: 0
                });
            }
        } catch (err) {
            console.error('Failed to fetch employee performance:', err);
            setError('Failed to load employee performance data');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'operator': return 'bg-green-100 text-green-700 border-green-200';
            case 'manager': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'qc': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'supervisor': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getProcessColor = (process) => {
        const colors = {
            'CUTTING': 'bg-red-500',
            'SEWING': 'bg-blue-500',
            'FINISHING': 'bg-green-500',
            'QC': 'bg-orange-500',
            'PACKING': 'bg-purple-500'
        };
        return colors[process?.toUpperCase()] || 'bg-slate-500';
    };

    // Generate initials for avatar
    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
            {/* Top Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Employee Performance</h2>
                    <p className="text-sm text-slate-500 mt-1">Track productivity and work logs across the production line.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Date Range Picker */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={18} className="text-slate-400" />
                        </div>
                        <select 
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="pl-10 pr-10 py-2.5 h-10 bg-gray-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer appearance-none"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 3 Months</option>
                            <option value="180">Last 6 Months</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={18} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
                    >
                        <Download size={18} />
                        <span>Export CSV</span>
                    </button>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors"
                    >
                        <FileText size={18} />
                        <span>Export PDF</span>
                    </button>
                </div>
            </header>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
                    
                    {/* Error Alert */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Employees */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Employees</p>
                                <h3 className="text-3xl font-bold text-slate-900">
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : summary.total_employees}
                                </h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                                    <Users size={14} />
                                    {summary.active_employees} active in period
                                </p>
                            </div>
                            <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users size={24} />
                            </div>
                        </div>

                        {/* Total Output */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Output</p>
                                <h3 className="text-3xl font-bold text-slate-900">
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : (
                                        <>
                                            {summary.total_output?.toLocaleString()} <span className="text-lg font-medium text-slate-400">pcs</span>
                                        </>
                                    )}
                                </h3>
                                <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                                    <TrendingUp size={14} />
                                    Production output
                                </p>
                            </div>
                            <div className="size-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <CheckCircle size={24} />
                            </div>
                        </div>

                        {/* Total Work Logs */}
                        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 mb-1">Total Work Logs</p>
                                <h3 className="text-3xl font-bold text-slate-900">
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : summary.total_logs?.toLocaleString()}
                                </h3>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                                    <Clock size={14} />
                                    Logged activities
                                </p>
                            </div>
                            <div className="size-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                <FileText size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Data Table Section */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 size={32} className="animate-spin text-primary" />
                            </div>
                        ) : employees.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Users size={48} className="mb-4 opacity-30" />
                                <p className="font-medium">No employee data found</p>
                                <p className="text-sm mt-1">No work logs recorded in the selected period</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                                            <th className="px-6 py-4 w-12"></th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 group">
                                                <div className="flex items-center gap-1">
                                                    Employee
                                                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 group">
                                                <div className="flex items-center gap-1">
                                                    Role
                                                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 group">
                                                <div className="flex items-center justify-end gap-1">
                                                    Total Output
                                                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 group">
                                                <div className="flex items-center justify-end gap-1">
                                                    Logs
                                                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 group">
                                                <div className="flex items-center justify-end gap-1">
                                                    Avg / Day
                                                    <ChevronDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employees.map((emp) => (
                                            <React.Fragment key={emp.user_id}>
                                                <tr 
                                                    onClick={() => toggleRow(emp.user_id)}
                                                    className={`hover:bg-slate-50 transition-colors cursor-pointer group ${expandedRows[emp.user_id] ? 'bg-slate-50' : 'bg-white'}`}
                                                >
                                                    <td className="px-6 py-4 text-slate-400">
                                                        <ChevronDown 
                                                            size={20} 
                                                            className={`transform transition-transform duration-200 ${expandedRows[emp.user_id] ? 'rotate-180 text-slate-600' : '-rotate-90 group-hover:text-slate-600'}`} 
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                                {getInitials(emp.user_name)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">{emp.user_name}</p>
                                                                <p className="text-xs text-slate-500">ID: #{emp.user_id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(emp.role)}`}>
                                                            {emp.role || 'Operator'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                        {emp.total_quantity?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-600">
                                                        {emp.task_count || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-slate-600">
                                                        {emp.avg_per_day || 0}
                                                    </td>
                                                </tr>
                                                {expandedRows[emp.user_id] && (
                                                    <tr className="bg-slate-50 animate-in slide-in-from-top-2 duration-200">
                                                        <td className="p-0" colSpan="6">
                                                            <div className="px-6 py-4 border-l-4 border-primary ml-6 my-2">
                                                                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Detailed Activity Log</p>
                                                                {emp.logs && emp.logs.length > 0 ? (
                                                                    <table className="w-full text-sm">
                                                                        <thead>
                                                                            <tr className="text-slate-400 text-xs border-b border-slate-200">
                                                                                <th className="pb-2 font-medium text-left">Date</th>
                                                                                <th className="pb-2 font-medium text-left">PO Number</th>
                                                                                <th className="pb-2 font-medium text-left">Process</th>
                                                                                <th className="pb-2 font-medium text-right">Quantity</th>
                                                                                <th className="pb-2 font-medium text-left pl-4">Notes</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="text-slate-600">
                                                                            {emp.logs.slice(0, 10).map((detail, idx) => (
                                                                                <tr key={idx} className="border-b border-slate-200/50 last:border-0">
                                                                                    <td className="py-2.5">{detail.date}</td>
                                                                                    <td className="py-2.5 font-mono text-xs">{detail.po_number}</td>
                                                                                    <td className="py-2.5">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className={`size-2 rounded-full ${getProcessColor(detail.process)}`}></span> 
                                                                                            {detail.process}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-2.5 text-right font-medium">{detail.quantity}</td>
                                                                                    <td className={`py-2.5 pl-4 text-xs font-medium ${detail.notes === 'Overtime' ? 'text-orange-500' : 'text-slate-400'}`}>
                                                                                        {detail.notes}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                ) : (
                                                                    <div className="text-sm text-slate-400 py-2 italic">No recent log details available.</div>
                                                                )}
                                                                {emp.logs && emp.logs.length > 10 && (
                                                                    <p className="text-xs text-slate-400 mt-2 italic">
                                                                        Showing 10 of {emp.logs.length} logs
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {!loading && employees.length > 0 && (
                            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Showing <span className="font-bold text-slate-900">{employees.length}</span> employees with activity
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeePerformanceReport;
