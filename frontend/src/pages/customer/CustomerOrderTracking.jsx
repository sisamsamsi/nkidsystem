import React, { useState, useEffect } from 'react';
import { 
    Package, Truck, Scissors, CheckCircle2, 
    Search, AlertCircle, Loader2, Box,
    ClipboardCheck, PackageCheck, ArrowRight, Calendar,
    Clock, Shirt, Check, RotateCw, FileText, ImageOff, ChevronRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/axios';
import ImageWithFallback from '../../components/common/ImageWithFallback';

const CustomerOrderTracking = () => {
    const [searchParams] = useSearchParams();
    const poParam = searchParams.get('po');

    const [poNumber, setPoNumber] = useState('');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (poParam) {
            const formattedPo = poParam.trim();
            setPoNumber(formattedPo);
            
            const autoSearch = async () => {
                setLoading(true);
                setError('');
                setSearched(true);
                try {
                    const response = await api.get(`/track/${formattedPo}`);
                    if (response.data.success) {
                        setOrder(response.data.data);
                    } else {
                        setError(response.data.message || 'Order not found');
                        setOrder(null);
                    }
                } catch (err) {
                    console.error('Track error:', err);
                    if (err.response?.status === 404) {
                        setError('Order not found. Please check your PO Number.');
                    } else {
                        setError('Failed to fetch order. Please try again.');
                    }
                    setOrder(null);
                } finally {
                    setLoading(false);
                }
            };
            autoSearch();
        }
    }, [poParam]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!poNumber.trim()) {
            setError('Please enter a PO Number');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            const response = await api.get(`/track/${poNumber.trim()}`);
            
            if (response.data.success) {
                setOrder(response.data.data);
            } else {
                setError(response.data.message || 'Order not found');
                setOrder(null);
            }
        } catch (err) {
            console.error('Track error:', err);
            if (err.response?.status === 404) {
                setError('Order not found. Please check your PO Number.');
            } else {
                setError('Failed to fetch order. Please try again.');
            }
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'confirmed': 'bg-blue-100 text-blue-700 border-blue-200',
            'production': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'in_progress': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'quality_check': 'bg-orange-100 text-orange-700 border-orange-200',
            'packing': 'bg-purple-100 text-purple-700 border-purple-200',
            'shipped': 'bg-cyan-100 text-cyan-700 border-cyan-200',
            'completed': 'bg-green-100 text-green-700 border-green-200',
            'delivered': 'bg-green-100 text-green-700 border-green-200'
        };
        return colors[status?.toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const formatStatus = (status) => {
        if (!status) return 'Unknown';
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get icon for process step
    const getProcessIcon = (processName) => {
        const name = processName?.toLowerCase() || '';
        if (name.includes('cut')) return Scissors;
        if (name.includes('sew') || name.includes('jahit')) return Shirt;
        if (name.includes('qc') || name.includes('quality')) return ClipboardCheck;
        if (name.includes('finish')) return CheckCircle2;
        if (name.includes('pack')) return Package;
        if (name.includes('ship')) return Truck;
        return FileText;
    };

    // Render the detailed production steps timeline
    const renderProductionTimeline = () => {
        if (!order || !order.production_steps || order.production_steps.length === 0) {
            return (
                <div className="text-center py-10 text-slate-400">
                    <Clock size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No production tasks have been created yet</p>
                </div>
            );
        }

        return (
            <div className="relative">
                {/* Vertical line connector */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200"></div>

                <div className="space-y-6">
                    {order.production_steps.map((step, index) => {
                        const Icon = getProcessIcon(step.name);
                        const isCompleted = step.status === 'completed';
                        const isInProgress = step.status === 'in_progress';
                        const isPending = step.status === 'pending';

                        return (
                            <div key={step.id || index} className="relative flex gap-5">
                                {/* Step Icon */}
                                <div 
                                    className={`
                                        flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center 
                                        border-4 border-white z-10 transition-all
                                        ${isCompleted 
                                            ? 'bg-green-100 text-green-600 shadow-lg shadow-green-100' 
                                            : isInProgress 
                                                ? 'bg-primary text-white shadow-lg shadow-blue-200' 
                                                : 'bg-slate-100 text-slate-400'
                                        }
                                    `}
                                >
                                    {isCompleted ? (
                                        <Check size={20} />
                                    ) : isInProgress ? (
                                        <RotateCw size={20} className="animate-spin" />
                                    ) : (
                                        <Icon size={20} />
                                    )}
                                </div>

                                {/* Step Content */}
                                <div className={`flex-1 pt-1 ${isPending ? 'opacity-50' : ''}`}>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                        <div>
                                            <h3 className={`text-base font-bold ${isInProgress ? 'text-primary' : 'text-slate-800'}`}>
                                                {step.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {isCompleted 
                                                    ? `Completed ${step.completed_count}/${step.total_count} tasks`
                                                    : isInProgress
                                                        ? `Processing ${step.completed_count}/${step.total_count} tasks`
                                                        : `Pending - ${step.total_count} tasks scheduled`
                                                }
                                            </p>

                                            {/* Sub-processes for SEWING/FINISHING */}
                                            {step.sub_processes && step.sub_processes.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {step.sub_processes.map((sub, subIdx) => (
                                                        <div key={subIdx} className="flex items-center gap-3 text-sm pl-2 border-l-2 border-slate-200">
                                                            <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                                                            <span className={`flex-1 ${sub.status === 'completed' ? 'text-slate-600' : sub.status === 'in_progress' ? 'text-primary font-medium' : 'text-slate-400'}`}>
                                                                {sub.name}
                                                            </span>
                                                            {sub.status === 'completed' ? (
                                                                <span className="text-green-600 text-xs flex items-center gap-1">
                                                                    <Check size={12} /> Done
                                                                </span>
                                                            ) : sub.status === 'in_progress' ? (
                                                                <span className="text-blue-600 text-xs flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                                                    {sub.progress}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">Pending</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Progress bar for in-progress steps (only if no sub-processes) */}
                                            {isInProgress && (!step.sub_processes || step.sub_processes.length === 0) && (
                                                <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 max-w-md">
                                                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-2">
                                                        <span>Progress</span>
                                                        <span>{step.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                        <div 
                                                            className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                                                            style={{ width: `${step.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status badge or timestamp */}
                                        <div className="flex-shrink-0">
                                            {isInProgress ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide">
                                                    Current Stage
                                                </span>
                                            ) : isCompleted ? (
                                                <span className="text-xs font-medium text-slate-400">
                                                    {step.completed_at || step.updated_at}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-slate-400">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-2xl font-black tracking-tight">
                                <span className="text-red-500">N</span>
                                <span className="text-blue-500">K</span>
                                <span className="text-green-500">i</span>
                                <span className="text-yellow-500">d</span>
                                <span className="text-indigo-500">s</span>
                            </div>
                            <span className="hidden sm:block text-slate-400 text-sm ml-3 pl-3 border-l border-slate-200">
                                Order Tracking
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Hero Section with Search */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                        Track Your Order
                    </h1>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Enter your PO Number to see the current status of your production order.
                    </p>
                </div>

                {/* Search Box */}
                <div className="max-w-xl mx-auto mb-10">
                    <form onSubmit={handleSearch} className="relative">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={poNumber}
                                    onChange={(e) => setPoNumber(e.target.value)}
                                    placeholder="Enter PO Number (e.g., HND-20260110-001)"
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-slate-700 text-lg font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-lg shadow-slate-200/50 placeholder:text-slate-400"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Track</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="font-medium">{error}</span>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={48} className="animate-spin text-primary mb-4" />
                        <p className="text-slate-500 font-medium">Searching for your order...</p>
                    </div>
                )}

                {/* No Results State */}
                {!loading && searched && !order && !error && (
                    <div className="text-center py-20">
                        <Package size={64} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No order found</h3>
                        <p className="text-slate-500 mt-1">Please check your PO Number and try again.</p>
                    </div>
                )}

                {/* Order Result */}
                {!loading && order && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        
                        {/* Order Header Card */}
                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
                            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{order.po_number}</h1>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                            {formatStatus(order.status)}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-lg">{order.customer}</p>
                                    
                                    {/* Order details */}
                                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-400">
                                        {order.date && (
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                <span>Ordered: {order.date}</span>
                                            </div>
                                        )}
                                        {order.deadline && (
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                <span>Deadline: <span className="text-white font-medium">{order.deadline}</span></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-6 max-w-md">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span className="text-slate-400">Overall Progress</span>
                                            <span className="font-bold text-white">{order.overall_progress || 0}%</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${order.overall_progress || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col items-end">
                                    <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">Total Items</span>
                                    <span className="text-4xl font-black mt-1">{order.items?.length || 0}</span>
                                    <span className="text-sm text-slate-400">variants</span>
                                </div>
                            </div>
                            
                            {/* Decorative Background */}
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5">
                                <Package size={300} />
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Order Items - Left Side */}
                            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-slate-100">
                                    <h2 className="text-lg font-bold text-slate-800">Order Items</h2>
                                </div>
                                
                                {order.items && order.items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                                    <th className="px-6 py-4">Product / Variant</th>
                                                    <th className="px-6 py-4 text-right">Price</th>
                                                    <th className="px-6 py-4">Color</th>
                                                    <th className="px-6 py-4">Size</th>
                                                    <th className="px-6 py-4 text-center">Qty</th>
                                                    <th className="px-6 py-4">Progress</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {order.items.map((item, idx) => {
                                                    const progress = item.progress || 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    {/* Variant Image */}
                                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                                                                        <ImageWithFallback 
                                                                            src={item.image_url} 
                                                                            alt={item.variant}
                                                                            className="w-full h-full object-cover"
                                                                            fallback={<ImageOff size={20} className="text-slate-300" />}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-900">{item.product}</p>
                                                                        <p className="text-xs text-slate-500">{item.variant}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {item.price ? (
                                                                    <span className="font-semibold text-slate-900">
                                                                        Rp {Number(item.price).toLocaleString('id-ID')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium">
                                                                    {item.color || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-600">{item.size || '-'}</td>
                                                            <td className="px-6 py-4 text-center font-bold text-slate-900">{item.quantity || 0}</td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className={`h-full rounded-full transition-all duration-300 ${
                                                                                progress >= 100 ? 'bg-green-500' : 
                                                                                progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                                                                            }`} 
                                                                            style={{width: `${Math.min(progress, 100)}%`}}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-slate-700 w-10">
                                                                        {Math.round(progress)}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <Box size={40} className="mx-auto mb-3 opacity-50" />
                                        <p>No items found in this order</p>
                                    </div>
                                )}
                            </div>

                            {/* Production Steps Summary - Right Side */}
                            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                                <h2 className="text-lg font-bold text-slate-800 mb-2">Production Status</h2>
                                <p className="text-sm text-slate-500 mb-6">Based on production tasks</p>

                                {order.production_steps && order.production_steps.length > 0 ? (
                                    <div className="space-y-4">
                                        {order.production_steps.map((step, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-600">{step.name}</span>
                                                {step.status === 'completed' ? (
                                                    <span className="text-green-600 font-medium flex items-center gap-1">
                                                        <CheckCircle2 size={14} /> Done
                                                    </span>
                                                ) : step.status === 'in_progress' ? (
                                                    <span className="text-blue-600 font-medium flex items-center gap-1">
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                        In Progress
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 font-medium">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400 py-6">
                                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No tasks yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Detailed Production Tasks Timeline */}
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-slate-800">Detailed Production Tasks</h2>
                            </div>
                            
                            {renderProductionTimeline()}
                        </div>

                        {/* Shipment Info */}
                        {order.shipment && (
                            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                                        <Truck size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500">Tracking Number</p>
                                        <p className="font-bold text-slate-900 font-mono text-lg">{order.shipment.tracking_number}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <span className={`px-4 py-2 rounded-xl text-sm font-bold uppercase ${getStatusColor(order.shipment.status)}`}>
                                            {order.shipment.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Initial State - Before Search */}
                {!loading && !searched && (
                    <div className="text-center py-10">
                        <div className="inline-flex items-center justify-center size-20 rounded-full bg-blue-100 text-blue-600 mb-6">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">Ready to Track</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Enter your PO Number above to view the real-time status of your garment production order.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 mt-auto">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                    <p className="text-sm text-slate-400">
                        © {new Date().getFullYear()} NKids Production System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default CustomerOrderTracking;
