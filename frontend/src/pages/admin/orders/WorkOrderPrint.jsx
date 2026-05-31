import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Loader2, Package, Calendar, User, MapPin, AlertCircle } from 'lucide-react';
import { orderService } from '../../../services/orderService';
import { getColorBlockInlineStyle } from '../../../lib/colorblock';

const WorkOrderPrint = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const response = await orderService.getById(id);
                setOrder(response.data || response);
            } catch (err) {
                setError('Gagal memuat data order');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Group order items by variant name for display
    const groupedItems = order?.items?.reduce((acc, item) => {
        const variantName = item.variant?.name || 'Unknown';
        if (!acc[variantName]) {
            acc[variantName] = [];
        }
        acc[variantName].push(item);
        return acc;
    }, {}) || {};

    // Default production processes (used when no tasks data available)
    const defaultProcesses = ['CUTTING', 'SEWING', 'QC', 'FINISHING', 'PACKING'];

    // Get unique processes from all items, or use defaults
    const getUniqueProcesses = () => {
        const processes = [];
        order?.items?.forEach(item => {
            item.productionTasks?.forEach(task => {
                const name = task.processTemplate?.name || task.process_template?.name || task.process_name;
                if (name && !processes.includes(name)) {
                    processes.push(name);
                }
            });
        });
        return processes.length > 0 ? processes : defaultProcesses;
    };
    
    const uniqueProcesses = getUniqueProcesses();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 size={48} className="animate-spin text-primary" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
                <AlertCircle size={48} className="text-rose-500" />
                <p className="text-slate-600">{error || 'Order tidak ditemukan'}</p>
                <button onClick={() => navigate('/admin/orders')} className="text-primary hover:underline">
                    Kembali ke Order List
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Print Controls - Hidden when printing */}
            <div className="print:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-50">
                <button 
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
                >
                    <ArrowLeft size={20} />
                    Kembali
                </button>
                <h1 className="text-lg font-bold text-slate-800">Surat Jalan Produksi</h1>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-all"
                >
                    <Printer size={18} />
                    Cetak
                </button>
            </div>

            {/* Print Content */}
            <div className="print:pt-0 pt-24 pb-8 px-4 flex justify-center">
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-xl print:shadow-none print:max-w-full p-8 print:p-6">
                    
                    {/* Header */}
                    <header className="border-b-2 border-slate-800 pb-4 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                                    Surat Jalan Produksi
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">Production Work Order</p>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-black text-primary">{order.po_number}</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Dicetak: {formatDate(new Date())}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Order Info */}
                    <section className="grid grid-cols-2 gap-6 mb-6 text-sm">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <span className="text-slate-500">Customer:</span>
                                <span className="font-bold text-slate-800">{order.customer?.name || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="text-slate-500">Branch:</span>
                                <span className="font-medium text-slate-700">{order.branch?.name || '-'}</span>
                            </div>
                        </div>
                        <div className="space-y-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-slate-500">Tanggal Order:</span>
                                <span className="font-bold text-slate-800">{formatDate(order.date)}</span>
                                <Calendar size={14} className="text-slate-400" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <span className="text-slate-500">Deadline:</span>
                                <span className="font-bold text-rose-600">{formatDate(order.deadline_date)}</span>
                            </div>
                        </div>
                    </section>

                    {/* Items Table - Grouped by Variant with Colorblock breakdown */}
                    <section className="mb-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Breakdown Per Colorblock
                        </h2>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700">Variant</th>
                                    <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700">Colorblock</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700">Size</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedItems).map(([variantName, items], vIdx) => (
                                    items.map((item, iIdx) => (
                                        <tr key={`${vIdx}-${iIdx}`} className={iIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                            <td className="border border-slate-300 px-3 py-2 font-medium">
                                                {iIdx === 0 ? variantName : ''}
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2">
                                                <span 
                                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold"
                                                    style={getColorBlockInlineStyle(item.color)}
                                                >
                                                    {item.color || '-'}
                                                </span>
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 text-center font-bold">
                                                {item.size}
                                            </td>
                                            <td className="border border-slate-300 px-3 py-2 text-center font-bold text-primary">
                                                {item.quantity}
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-800 text-white">
                                    <td colSpan="3" className="border border-slate-300 px-3 py-2 font-bold text-right">
                                        TOTAL
                                    </td>
                                    <td className="border border-slate-300 px-3 py-2 text-center font-black text-lg">
                                        {order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    {/* Process Checklist */}
                    <section className="mb-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Checklist Proses Produksi
                        </h2>
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700 w-8">✓</th>
                                    <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700">Proses</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700 w-20">Qty</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700 w-24">Tanggal</th>
                                    <th className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700 w-32">TTD Operator</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uniqueProcesses.map((process, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-300 px-3 py-3 text-center">
                                            <div className="w-5 h-5 border-2 border-slate-400 rounded"></div>
                                        </td>
                                        <td className="border border-slate-300 px-3 py-3 font-bold uppercase">
                                            {process}
                                        </td>
                                        <td className="border border-slate-300 px-3 py-3 text-center">
                                            <div className="border-b border-dashed border-slate-300 h-5"></div>
                                        </td>
                                        <td className="border border-slate-300 px-3 py-3 text-center">
                                            <div className="border-b border-dashed border-slate-300 h-5"></div>
                                        </td>
                                        <td className="border border-slate-300 px-3 py-3">
                                            <div className="border-b border-dashed border-slate-300 h-5"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Notes */}
                    <section className="mb-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Catatan
                        </h2>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 min-h-[80px]">
                            <p className="text-sm text-slate-600">{order.notes || ''}</p>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="border-t border-slate-200 pt-4 mt-auto">
                        <div className="flex justify-between items-center text-xs text-slate-400">
                            <div>
                                <span className="font-bold">NKids Production System</span> • Dokumen internal
                            </div>
                            <div>
                                Status: <span className="font-bold uppercase">{order.status}</span>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default WorkOrderPrint;
