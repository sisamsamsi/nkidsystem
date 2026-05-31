import React, { useState, useEffect, useCallback } from 'react';
import { 
    Factory, RefreshCw, LogOut, 
    ClipboardCheck, Bell, Search, Filter,
    Clock, AlertCircle, ChevronRight, ChevronUp, ChevronDown,
    Loader2, ArrowUpDown, Image
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkLogModal from '../../components/station/WorkLogModal';
import QCLogModal from '../../components/station/QCLogModal';
import { stationService } from '../../services/stationService';

const getColorCode = (colorName) => {
    if (!colorName) return '#6b7280';
    const name = colorName.toLowerCase();
    if (name.includes('navy') || name.includes('dongker')) return '#1e3a8a';
    if (name.includes('blue') || name.includes('biru')) return '#3b82f6';
    if (name.includes('red') || name.includes('merah')) return '#ef4444';
    if (name.includes('green') || name.includes('hijau')) return '#22c55e';
    if (name.includes('yellow') || name.includes('kuning')) return '#eab308';
    if (name.includes('black') || name.includes('hitam')) return '#0f172a';
    if (name.includes('white') || name.includes('putih')) return '#f8fafc';
    if (name.includes('grey') || name.includes('gray') || name.includes('abu')) return '#64748b';
    if (name.includes('cream') || name.includes('krem')) return '#fef08a';
    if (name.includes('orange') || name.includes('jingga')) return '#f97316';
    if (name.includes('pink') || name.includes('merah muda')) return '#ec4899';
    if (name.includes('purple') || name.includes('ungu')) return '#a855f7';
    return '#6b7280';
};

const StationDashboard = () => {
    const navigate = useNavigate();
    
    // Modal State
    const [isWorkLogOpen, setIsWorkLogOpen] = useState(false);
    const [isQCOpen, setIsQCOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    // Multi-select State
    const [selectedTasks, setSelectedTasks] = useState([]);
    
    // Data State
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('priority');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Station info
    const station = stationService.getStoredStation();
    
    // Detect if current station is QC
    const isQCStation = station?.name?.toLowerCase().includes('qc') || 
                        station?.name?.toLowerCase().includes('quality');

    // Fetch tasks from API
    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const response = await stationService.getTasks();
            const apiData = response.data || response;
            const apiTasks = Array.isArray(apiData) ? apiData : (apiData.data || []);
            
            // Transform API data to component format
            const transformedTasks = apiTasks.map(task => {
                const item = task.order_item || task.orderItem;
                const order = item?.order;
                const variant = item?.variant;
                const product = variant?.product;

                return {
                    id: task.id,
                    poDisplay: `#${order?.po_number || task.id}`,
                    productName: product?.name || 'Unknown Product',
                    variantName: variant?.name || 'N/A',
                    colorblock: {
                        name: item?.color || 'N/A',
                        colorCode: getColorCode(item?.color),
                        size: item?.size || variant?.size || ''
                    },
                    imageUrl: variant?.image_url || null,
                    priority: order?.priority || 'normal',
                    completed: task.completed_quantity || 0,
                    total: item?.quantity || 0,
                    status: task.status,
                    processName: task.process_template?.name || task.processTemplate?.name || '',
                    subProcessName: task.sub_process?.name || task.subProcess?.name || null
                };
            });
            
            setTasks(transformedTasks);
            setError('');
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Gagal memuat data dari server. Menampilkan data contoh.');
            // Fallback to mock data if API fails
            setTasks([
                {
                    id: 1,
                    poDisplay: '#8821-AW',
                    productName: 'Triloka',
                    variantName: 'Mega',
                    colorblock: { name: 'Navy Blue, Cream', colorCode: '#1e3a8a', size: '4T' },
                    priority: 'urgent',
                    completed: 50,
                    total: 500,
                    status: 'in_progress'
                },
                {
                    id: 2,
                    poDisplay: '#8824-SS',
                    productName: 'Simfoni',
                    variantName: 'Nusa',
                    colorblock: { name: 'Heather Grey, Black', colorCode: '#9ca3af', size: '6' },
                    priority: 'high',
                    completed: 120,
                    total: 200,
                    status: 'in_progress'
                },
            ]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Check auth
        if (!stationService.isAuthenticated()) {
            navigate('/station/login');
            return;
        }
        stationService.initAuth();
        fetchTasks();
    }, [navigate, fetchTasks]);

    // Handle sorting
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // SortIcon component for table headers
    const SortIcon = ({ field }) => {
        if (sortField !== field) {
            return <ArrowUpDown size={14} className="ml-1.5 opacity-30 group-hover:opacity-60" />;
        }
        return sortOrder === 'asc' 
            ? <ChevronUp size={14} className="ml-1.5 text-primary" />
            : <ChevronDown size={14} className="ml-1.5 text-primary" />;
    };

    // Filter and sort tasks
    const filteredTasks = tasks
        .filter(task => {
            // Priority filter
            if (activeFilter === 'urgent' && task.priority !== 'urgent') return false;
            if (activeFilter === 'high' && task.priority !== 'high') return false;
            
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    task.poDisplay?.toLowerCase().includes(query) ||
                    task.productName?.toLowerCase().includes(query) ||
                    task.variantName?.toLowerCase().includes(query) ||
                    task.processName?.toLowerCase().includes(query) ||
                    task.colorblock?.name?.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'po_number':
                    comparison = (a.poDisplay || '').localeCompare(b.poDisplay || '');
                    break;
                case 'product':
                    comparison = (a.productName || '').localeCompare(b.productName || '');
                    break;
                case 'process':
                    comparison = (a.processName || '').localeCompare(b.processName || '');
                    break;
                case 'progress':
                    const progressA = a.total > 0 ? a.completed / a.total : 0;
                    const progressB = b.total > 0 ? b.completed / b.total : 0;
                    comparison = progressA - progressB;
                    break;
                case 'priority':
                default:
                    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                    comparison = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const handleLogout = () => {
        stationService.logout();
        navigate('/station/login');
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setIsWorkLogOpen(true);
    };

    const handleQCClick = (e, task) => {
        e.stopPropagation();
        setSelectedTask(task);
        setIsQCOpen(true);
    };

    // Multi-select handlers
    const handleSelectTask = (e, taskId) => {
        e.stopPropagation();
        setSelectedTasks(prev => 
            prev.includes(taskId) 
                ? prev.filter(id => id !== taskId)
                : [...prev, taskId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTasks.length === filteredTasks.length) {
            setSelectedTasks([]);
        } else {
            setSelectedTasks(filteredTasks.map(t => t.id));
        }
    };

    const handleBatchWorkLog = () => {
        // Pass all selected tasks to the modal
        const tasksToLog = filteredTasks.filter(t => selectedTasks.includes(t.id));
        setSelectedTask(tasksToLog); // Pass as array
        setIsWorkLogOpen(true);
    };

    const handleClearSelection = () => {
        setSelectedTasks([]);
    };

    const cn = (...inputs) => inputs.filter(Boolean).join(' ');

    const getStationColor = (processName) => {
        const name = processName?.toLowerCase() || '';
        if (name.includes('cutting')) return 'bg-sky-500';
        if (name.includes('sewing')) return 'bg-violet-500';
        if (name.includes('packing')) return 'bg-rose-500';
        if (name.includes('sablon')) return 'bg-amber-500';
        return 'bg-primary';
    };

    const getStationSoftColor = (processName) => {
        const name = processName?.toLowerCase() || '';
        if (name.includes('cutting')) return 'bg-sky-50 text-sky-600 border-sky-100';
        if (name.includes('sewing')) return 'bg-violet-50 text-violet-600 border-violet-100';
        if (name.includes('packing')) return 'bg-rose-50 text-rose-600 border-rose-100';
        if (name.includes('sablon')) return 'bg-amber-50 text-amber-600 border-amber-100';
        return 'bg-blue-50 text-primary border-blue-100';
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'bg-rose-50 text-rose-600 border-rose-200';
            case 'high':
                return 'bg-amber-50 text-amber-600 border-amber-200';
            case 'normal':
                return 'bg-slate-50 text-slate-500 border-slate-200';
            default:
                return 'bg-slate-50 text-slate-400 border-slate-200';
        }
    };

    // Calculate real shift progress
    const totalQty = tasks.reduce((sum, t) => sum + (t.total || 0), 0);
    const completedQty = tasks.reduce((sum, t) => sum + (t.completed || 0), 0);
    const shiftProgressPercent = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900 overflow-hidden">
            {/* V2 Compact Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30 px-8 py-3">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                            <Factory size={22} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">Station Mode</h1>
                                <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-100 flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                Workstation: <span className="text-slate-600">{station?.name || 'Undefined'}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Compact Stats */}
                        <div className="hidden md:flex items-center gap-8 mr-8">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shift Progress</p>
                                <p className="text-sm font-black text-slate-700">{shiftProgressPercent}% Complete</p>
                            </div>
                            <div className="w-px h-8 bg-slate-100" />
                        </div>

                        <button className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center transition-all hover:bg-slate-100 hover:text-slate-600 relative">
                            <Bell size={20} strokeWidth={2.5} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
                        </button>
                        
                        <button 
                            onClick={handleLogout}
                            className="h-10 px-4 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2 transition-all hover:bg-rose-600 hover:text-white hover:border-rose-600"
                        >
                            <LogOut size={16} strokeWidth={2.5} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter Bar with Search */}
            <div className="bg-white/50 border-b border-slate-100 px-8 py-4">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-start md:items-center gap-4">
                    {/* Search Input */}
                    <div className="relative w-full md:max-w-md group">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Cari PO, produk, atau station..."
                            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Priority Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { key: 'all', label: 'Semua' },
                            { key: 'urgent', label: 'Urgent' },
                            { key: 'high', label: 'High' }
                        ].map((filter) => (
                            <button 
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border-2",
                                    activeFilter === filter.key 
                                        ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                                        : "bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:text-slate-600"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex-1" />

                    {/* Refresh Button */}
                    <button 
                        onClick={fetchTasks}
                        className="px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'animate-spin text-primary' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Main Content Area - Table */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-[1600px] mx-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 text-[11px] font-black uppercase tracking-widest">
                            <AlertCircle size={18} strokeWidth={3} />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                            <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Memuat tugas produksi...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-300">
                            <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                                <ClipboardCheck size={48} strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest">Tidak ada tugas ditemukan</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-50 bg-slate-50/50">
                                            {/* Checkbox - Only for non-QC stations */}
                                            {!isQCStation && (
                                                <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[50px]">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                                    />
                                                </th>
                                            )}
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[70px]">
                                                Img
                                            </th>
                                            <th
                                                onClick={() => handleSort('po_number')}
                                                className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    PO Number
                                                    <SortIcon field="po_number" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('product')}
                                                className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    Variant
                                                    <SortIcon field="product" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('process')}
                                                className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    Station
                                                    <SortIcon field="process" />
                                                </div>
                                            </th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                Colorblock
                                            </th>
                                            <th
                                                onClick={() => handleSort('progress')}
                                                className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    Progress
                                                    <SortIcon field="progress" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('priority')}
                                                className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group hover:text-primary transition-colors"
                                            >
                                                <div className="flex items-center">
                                                    Priority
                                                    <SortIcon field="priority" />
                                                </div>
                                            </th>
                                            <th className="py-4 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTasks.map((task, index) => {
                                            const softClasses = getStationSoftColor(task.processName);
                                            const stationColor = getStationColor(task.processName);
                                            const progress = task.total > 0 ? Math.round((task.completed / task.total) * 100) : 0;
                                            
                                            return (
                                                <tr 
                                                    key={task.id}
                                                    onClick={() => handleTaskClick(task)}
                                                    className={cn(
                                                        "border-b border-slate-50 hover:bg-primary/5 cursor-pointer transition-colors group",
                                                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                                                        selectedTasks.includes(task.id) && 'bg-primary/10 hover:bg-primary/15'
                                                    )}
                                                >
                                                    {/* Checkbox */}
                                                    {!isQCStation && (
                                                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedTasks.includes(task.id)}
                                                                onChange={(e) => handleSelectTask(e, task.id)}
                                                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                                            />
                                                        </td>
                                                    )}
                                                    {/* Product Image */}
                                                    <td className="py-4 px-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden">
                                                            {task.imageUrl ? (
                                                                <img 
                                                                    src={task.imageUrl} 
                                                                    alt={task.variantName}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.parentNode.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image-off text-slate-300"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><path d="M13.5 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h15a2 2 0 0 1 2 2v9.5"/><path d="m10 14 5.07-5.07a1.41 1.41 0 0 1 2 0l3.93 3.93"/></svg>';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Image size={20} strokeWidth={1.5} />
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* PO Number */}
                                                    <td className="py-4 px-4">
                                                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">
                                                            {task.poDisplay}
                                                        </span>
                                                    </td>
                                                    
                                                    {/* Variant Name */}
                                                    <td className="py-4 px-4">
                                                        <span className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">
                                                            {task.variantName}
                                                        </span>
                                                    </td>
                                                    
                                                    {/* Station/Process */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className={cn("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border inline-block w-fit", softClasses)}>
                                                                {task.processName || 'N/A'}
                                                            </span>
                                                            {task.subProcessName && (
                                                                <span className="text-[10px] text-slate-500 font-medium pl-1">
                                                                    → {task.subProcessName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Colorblock Info */}
                                                    <td className="py-4 px-4">
                                                        <div className="text-xs text-slate-500">
                                                            <span className="font-semibold">{task.colorblock?.name || 'N/A'}</span>
                                                            {task.colorblock?.size && (
                                                                <span className="text-slate-400"> / {task.colorblock.size}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Progress */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden min-w-[80px]">
                                                                <div 
                                                                    className={cn("h-full rounded-full transition-all", stationColor)}
                                                                    style={{ width: `${Math.max(5, progress)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 min-w-[70px] text-right">
                                                                {task.completed} / {task.total}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    
                                                    {/* Priority */}
                                                    <td className="py-4 px-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border",
                                                            getPriorityBadge(task.priority)
                                                        )}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    
                                                    {/* Actions */}
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {/* QC Inspection - Only for QC Station */}
                                                            {isQCStation && (
                                                                <button 
                                                                    onClick={(e) => handleQCClick(e, task)}
                                                                    className="w-9 h-9 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center shadow-lg shadow-emerald-200"
                                                                    title="QC Inspection"
                                                                >
                                                                    <ClipboardCheck size={16} strokeWidth={2.5} />
                                                                </button>
                                                            )}
                                                            {/* Log Work - Only for non-QC Stations */}
                                                            {!isQCStation && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                                                                    className="w-9 h-9 rounded-xl bg-slate-900 text-white hover:bg-primary transition-all flex items-center justify-center shadow-lg shadow-slate-200"
                                                                    title="Log Work"
                                                                >
                                                                    <ChevronRight size={18} strokeWidth={3} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Table Footer */}
                            <div className="bg-slate-50/50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-400">
                                    Menampilkan <span className="text-slate-700">{filteredTasks.length}</span> tugas
                                </p>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <Clock size={14} />
                                    Last updated: <span className="text-slate-600">{loading ? 'Updating...' : new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Bar for Multi-Select - Only for non-QC stations */}
            {!isQCStation && selectedTasks.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-slate-900/30 flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-sm font-black">
                                {selectedTasks.length}
                            </div>
                            <div>
                                <p className="text-sm font-bold">Tugas dipilih</p>
                                <p className="text-xs text-slate-400">Siap untuk log kerja batch</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-700" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClearSelection}
                                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBatchWorkLog}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-blue-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
                            >
                                <ChevronRight size={18} strokeWidth={3} />
                                Log Work Sekaligus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <WorkLogModal 
                isOpen={isWorkLogOpen} 
                onClose={() => { setIsWorkLogOpen(false); setSelectedTasks([]); }} 
                task={selectedTask}
                onSuccess={() => { fetchTasks(); setSelectedTasks([]); }}
            />
            
            <QCLogModal
                isOpen={isQCOpen}
                onClose={() => setIsQCOpen(false)}
                task={selectedTask}
                onSuccess={fetchTasks}
            />
        </div>
    );
};

export default StationDashboard;
