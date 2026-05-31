import React, { useEffect, useState, useCallback } from 'react';
import { 
    Search, Filter, Calendar, Plus, MoreHorizontal, 
    ChevronDown, AlertCircle, Clock, CheckCircle2, 
    Loader2, Hash, Layers, Box, Info, ArrowUpRight,
    ArrowUpDown, History, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productionTaskService } from '../../../services/productionTaskService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getColorBlockInlineStyle } from '../../../lib/colorblock';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const ProductionBoard = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [stationFilter, setStationFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [sortField, setSortField] = useState('priority');
    const [sortOrder, setSortOrder] = useState('asc');
    const [sortBy, setSortBy] = useState('priority'); // 'priority' or 'recent'
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0
    });

    const stations = [
        { id: 'all', name: 'Semua Station' },
        { id: '1', name: 'Cutting' },
        { id: '2', name: 'Sablon' },
        { id: '3', name: 'Sewing' },
        { id: '4', name: 'Finishing' },
        { id: '5', name: 'Packing' },
    ];

    const fetchTasks = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                per_page: 20,
                search: searchQuery,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                priority: priorityFilter !== 'all' ? priorityFilter : undefined,
                process_template_id: stationFilter !== 'all' ? stationFilter : undefined,
                sort_field: sortField,
                sort_order: sortOrder,
                sort: sortBy === 'recent' ? 'recent' : undefined
            };
            const response = await productionTaskService.getAll(params);
            const responseData = response.data || {};
            
            setTasks(responseData.data || []);
            setPagination({
                current_page: responseData.current_page || 1,
                last_page: responseData.last_page || 1,
                total: responseData.total || 0
            });
        } catch (err) {
            console.error('Failed to fetch tasks', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, priorityFilter, stationFilter, sortField, sortOrder, sortBy]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTasks(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchTasks]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return "bg-rose-50 text-rose-600 border-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.1)]";
            case 'high':
                return "bg-orange-50 text-orange-600 border-orange-100";
            case 'normal':
                return "bg-slate-50 text-slate-500 border-slate-100";
            default:
                return "bg-slate-50 text-slate-400 border-slate-100";
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return "bg-emerald-50 text-emerald-600 border-emerald-100";
            case 'in_progress':
                return "bg-sky-50 text-sky-600 border-sky-100";
            default:
                return "bg-slate-50 text-slate-400 border-slate-100";
        }
    };

    const getStationBadge = (stationName) => {
        const colors = {
            'Cutting': 'bg-violet-50 text-violet-600 border-violet-100',
            'Sablon': 'bg-amber-50 text-amber-600 border-amber-100',
            'Sewing': 'bg-blue-50 text-blue-600 border-blue-100',
            'Finishing': 'bg-pink-50 text-pink-600 border-pink-100',
            'Packing': 'bg-indigo-50 text-indigo-600 border-indigo-100'
        };
        return colors[stationName] || 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const SortIcon = ({ field }) => (
        <ArrowUpDown 
            size={12} 
            className={cn(
                "transition-all duration-300",
                sortField === field ? "opacity-100 text-primary scale-110" : "opacity-0 group-hover/th:opacity-50"
            )} 
        />
    );

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Layers size={20} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Production Board</h1>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-11">Monitoring Real-time Produksi Garment</p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/admin/orders/new')}
                        className="h-12 px-6 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Order Baru
                    </button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[280px] group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} strokeWidth={2.5} />
                    <input 
                        type="text"
                        placeholder="Cari PO atau Produk..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-slate-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-slate-700 text-sm"
                    />
                </div>

                <div className="h-8 w-px bg-slate-100 mx-2 hidden lg:block" />

                {/* Station Filter */}
                <div className="flex items-center gap-2 px-2">
                    <Filter size={16} className="text-slate-400" strokeWidth={2.5} />
                    <select 
                        value={stationFilter}
                        onChange={(e) => setStationFilter(e.target.value)}
                        className="h-12 bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                    >
                        {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 px-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-12 bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Antrian</option>
                        <option value="in_progress">Berjalan</option>
                        <option value="completed">Selesai</option>
                    </select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center gap-2 px-2 border-l border-slate-100">
                    <AlertCircle size={16} className="text-slate-400" strokeWidth={2.5} />
                    <select 
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="h-12 bg-transparent font-black text-[10px] uppercase tracking-widest text-slate-600 outline-none cursor-pointer"
                    >
                        <option value="all">Prioritas</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                    </select>
                </div>

                {/* Sort Filter - "Recent" */}
                <div className="flex items-center gap-2 px-4 border-l border-slate-100">
                    <button 
                        onClick={() => setSortBy(sortBy === 'priority' ? 'recent' : 'priority')}
                        className={cn(
                            "flex items-center gap-2 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                            sortBy === 'recent' ? "bg-amber-50 text-amber-600 border border-amber-100" : "text-slate-400 hover:bg-slate-50"
                        )}
                    >
                        {sortBy === 'recent' ? <History size={14} strokeWidth={3} /> : <ArrowUpDown size={14} strokeWidth={3} />}
                        {sortBy === 'recent' ? 'Terbaru (Recent)' : 'Urut Prioritas'}
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-0">
                <div className="overflow-x-auto scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th 
                                    onClick={() => handleSort('po_number')}
                                    className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/th"
                                >
                                    <div className="flex items-center gap-2">
                                        Order Info
                                        <SortIcon field="po_number" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('station')}
                                    className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/th"
                                >
                                    <div className="flex items-center gap-2">
                                        Station
                                        <SortIcon field="station" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('priority')}
                                    className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/th"
                                >
                                    <div className="flex items-center gap-2">
                                        Priority
                                        <SortIcon field="priority" />
                                    </div>
                                </th>
                                <th 
                                    onClick={() => handleSort('progress')}
                                    className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors group/th"
                                >
                                    <div className="flex items-center gap-2">
                                        Work Progress
                                        <SortIcon field="progress" />
                                    </div>
                                </th>
                                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</th>
                                <th 
                                    onClick={() => handleSort('updated_at')}
                                    className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-primary transition-colors group/th"
                                >
                                    <div className="flex items-center justify-end gap-2">
                                        Updated
                                        <SortIcon field="updated_at" />
                                    </div>
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-8 py-10">
                                            <div className="h-12 bg-slate-50 rounded-2xl w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <tr 
                                        key={task.id} 
                                        className="group hover:bg-slate-50/50 transition-all duration-300"
                                    >
                                        {/* Order Info */}
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl border flex items-center justify-center font-black text-[10px] uppercase",
                                                    getPriorityStyle(task.order_item?.order?.priority)
                                                )}>
                                                    {task.order_item?.order?.priority?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 leading-tight tracking-tight">
                                                        {task.order_item?.order?.po_number}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                        {task.order_item?.variant?.product?.name}
                                                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                        <span 
                                                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                                                            style={getColorBlockInlineStyle(task.order_item?.variant?.name)}
                                                        >
                                                            {task.order_item?.variant?.name}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Station */}
                                        <td className="px-6 py-5">
                                            <div className={cn(
                                                "inline-flex items-center px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest",
                                                getStationBadge(task.process_template?.name)
                                            )}>
                                                {task.process_template?.name}
                                            </div>
                                        </td>

                                        {/* Priority */}
                                        <td className="px-6 py-5">
                                            <div className={cn(
                                                "inline-flex items-center px-3 py-1.5 rounded-xl border font-black text-[9px] uppercase tracking-widest",
                                                getPriorityStyle(task.order_item?.order?.priority)
                                            )}>
                                                {task.order_item?.order?.priority}
                                            </div>
                                        </td>

                                        {/* Work Progress */}
                                        <td className="px-6 py-5">
                                            <div className="w-48 space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                                    <span className={cn(
                                                        task.status === 'completed' ? "text-emerald-500" : "text-slate-400"
                                                    )}>
                                                        {task.status?.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-slate-700">{task.progress_percent}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={cn(
                                                            "h-full transition-all duration-1000 ease-out rounded-full",
                                                            task.status === 'completed' ? "bg-emerald-500" : "bg-primary"
                                                        )}
                                                        style={{ width: `${task.progress_percent}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-700 tracking-tight">
                                                    {task.completed_quantity} / {task.order_item?.quantity}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pcs Completed</span>
                                            </div>
                                        </td>

                                        {/* Updated */}
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[11px] font-bold text-slate-600">
                                                    {new Date(task.updated_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    {new Date(task.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => navigate(`/admin/production/tasks/${task.id}`)}
                                                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-primary shadow-sm transition-all active:scale-95"
                                                    title="View Details"
                                                >
                                                    <ArrowUpRight size={18} strokeWidth={2.5} />
                                                </button>
                                                <button className="p-2.5 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-slate-600 shadow-sm transition-all active:scale-95">
                                                    <MoreHorizontal size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300">
                                                <Info size={32} strokeWidth={1.5} />
                                            </div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Tidak ada data produksi ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Showing <span className="text-slate-800">{tasks.length}</span> of {pagination.total} Tasks
                    </p>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        <button 
                            disabled={pagination.current_page === 1}
                            onClick={() => fetchTasks(pagination.current_page - 1)}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ArrowUpDown size={16} className="rotate-90" />
                        </button>
                        <div className="px-4 text-[10px] font-black text-primary uppercase tracking-widest border-x border-slate-50">
                            Page {pagination.current_page}
                        </div>
                        <button 
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => fetchTasks(pagination.current_page + 1)}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ArrowUpDown size={16} className="-rotate-90" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionBoard;
