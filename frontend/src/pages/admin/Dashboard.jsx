import React, { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Loader2 } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { reportService } from '../../services/reportService';
import { Link } from 'react-router-dom';
import { getColorBlockInlineStyle } from '../../lib/colorblock';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        inProgress: 0,
        completed: 0,
        urgent: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [pipeline, setPipeline] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch orders for stats and recent list
                const ordersRes = await orderService.getAll({ per_page: 8 });
                const orders = ordersRes.data?.data || ordersRes.data || [];
                
                // Calculate stats from orders
                const totalOrders = ordersRes.data?.total || orders.length;
                const inProgress = orders.filter(o => o.status === 'in_progress' || o.status === 'production').length;
                const completed = orders.filter(o => o.status === 'completed').length;
                const urgent = orders.filter(o => o.priority === 'urgent').length;

                setStats({ totalOrders, inProgress, completed, urgent });
                setRecentOrders(orders.slice(0, 5));

                // Try to fetch pipeline stats
                try {
                    const pipelineRes = await reportService.getProductionSummary();
                    setPipeline(pipelineRes.data || []);
                } catch {
                    // Use mock pipeline if API not available
                    setPipeline([
                        { label: 'Cutting', val: 45, color: 'bg-indigo-400' },
                        { label: 'Sablon', val: 82, color: 'bg-sky-400' },
                        { label: 'Sewing', val: 64, color: 'bg-emerald-400' },
                        { label: 'Finishing', val: 30, color: 'bg-amber-400' },
                        { label: 'Packing', val: 15, color: 'bg-rose-400' },
                    ]);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
                setStats({ totalOrders: 0, inProgress: 0, completed: 0, urgent: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-amber-50 text-amber-600 border border-amber-100';
            case 'processing': case 'production': return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
            case 'cutting': return 'bg-sky-50 text-sky-600 border border-sky-100';
            case 'sewing': return 'bg-blue-50 text-blue-600 border border-blue-100';
            case 'sablon': return 'bg-violet-50 text-violet-600 border border-violet-100';
            case 'finishing': return 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100';
            case 'packing': return 'bg-rose-50 text-rose-600 border border-rose-100';
            case 'completed': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
            default: return 'bg-slate-50 text-slate-500 border border-slate-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Heading */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light text-slate-800 tracking-tight">Dashboard</h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">Overview of production status</p>
                </div>
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-100 p-1">
                    <button className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-slate-700">
                        <Calendar size={18} className="text-slate-400" />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <button className="p-1.5 rounded-md hover:bg-slate-50 text-slate-400 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1: Total Orders */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                            <ShoppingCart size={24} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +5.2%
                            <TrendingUp size={14} className="ml-0.5" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">{stats.totalOrders.toLocaleString()}</h3>
                    <p className="text-sm font-light text-slate-500">Total Orders</p>
                </div>

                {/* Card 2: In Progress */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
                            <Clock size={24} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +2.1%
                            <TrendingUp size={14} className="ml-0.5" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">{stats.inProgress}</h3>
                    <p className="text-sm font-light text-slate-500">In Progress</p>
                </div>

                {/* Card 3: Completed */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                            <CheckCircle size={24} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +8.4%
                            <TrendingUp size={14} className="ml-0.5" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">{stats.completed}</h3>
                    <p className="text-sm font-light text-slate-500">Completed</p>
                </div>

                {/* Card 4: Urgent */}
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.05)] hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="flex items-center text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            -1.2%
                            <TrendingDown size={14} className="ml-0.5" />
                        </span>
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-800 tracking-tight">{stats.urgent}</h3>
                    <p className="text-sm font-light text-slate-500">Urgent Tasks</p>
                </div>
            </div>

            {/* Main Grid: Charts & Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Production Progress Chart */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-slate-800">Production Progress</h3>
                            <p className="text-xs text-slate-400">Active batches by stage</p>
                        </div>
                        <button className="text-slate-400 hover:text-primary transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                        {pipeline.map((item, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-600">{item.label}</span>
                                    <span className="font-bold text-slate-800">{item.val}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className={`${item.color} h-2.5 rounded-full transition-all duration-500 group-hover:opacity-80`}
                                        style={{ width: `${item.val}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-medium text-slate-800">Recent Orders</h3>
                            <p className="text-xs text-slate-400">Latest production entries</p>
                        </div>
                        <Link to="/admin/orders" className="text-sm font-medium text-primary hover:text-primary/80">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">PO No.</th>
                                    <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
                                    <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Variant Items</th>
                                    <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 w-1/4">Progress</th>
                                    <th className="py-3 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {recentOrders.length > 0 ? recentOrders.map((order, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                                        <td className="py-4 px-2 font-medium text-slate-700">{order.po_number}</td>
                                        <td className="py-4 px-2 text-slate-600">{order.customer?.name || '-'}</td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-2">
                                                {order.items?.[0]?.variant?.image_url ? (
                                                    <img 
                                                        src={order.items[0].variant.image_url} 
                                                        alt={order.items[0].variant?.name}
                                                        className="w-8 h-8 rounded-lg object-cover border border-slate-100"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                                        ?
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">
                                                        {order.items?.[0]?.variant?.name || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        <span 
                                                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-1"
                                                            style={getColorBlockInlineStyle(order.items?.[0]?.color)}
                                                        >
                                                            {order.items?.[0]?.color || '-'}
                                                        </span>
                                                        / {order.items?.[0]?.size || '-'}
                                                        {order.items?.length > 1 && ` +${order.items.length - 1} more`}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div 
                                                    className="bg-emerald-500 h-1.5 rounded-full" 
                                                    style={{ width: `${order.overall_progress || 0}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getStatusStyle(order.status)}`}>
                                                {order.status || 'Pending'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="py-10 text-center text-slate-400 font-light">
                                            No recent orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200/50 text-center text-xs text-slate-400 font-light">
                © {new Date().getFullYear()} NKids Production System. All rights reserved.
            </div>
        </div>
    );
};

export default Dashboard;
