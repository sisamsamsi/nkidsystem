import React, { useState, useEffect, useMemo } from 'react';
import {
    Check, ArrowRight, Loader2, AlertCircle, 
    Package, Search, X, ChevronDown
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../../../services/orderService';
import { productService } from '../../../services/productService';
import { customerService } from '../../../services/customerService';
import api from '../../../lib/axios';
import { nameToHex } from '../../../lib/colors';

// Helper to determine text color based on background luminance
const getContrastColor = (hexColor) => {
    if (!hexColor) return '#64748b';
    
    // Handle HSL fallback from nameToHex
    if (hexColor.startsWith('hsl')) {
        const match = hexColor.match(/(\d+)%\)/);
        if (match) {
            const l = parseInt(match[1]);
            return l > 65 ? '#1e293b' : '#ffffff';
        }
        return '#ffffff';
    }

    // Handle Hex
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.65 ? '#1e293b' : '#ffffff';
};

const OrderWizard = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    // UI State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generatingPO, setGeneratingPO] = useState(false);
    const [error, setError] = useState('');
    const [showReview, setShowReview] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Data
    const [customers, setCustomers] = useState([]);
    const [allProducts, setAllProducts] = useState([]); // All products from API
    const [quantities, setQuantities] = useState({}); // { "variantId-size": qty }

    // Form State
    const [orderDetails, setOrderDetails] = useState({
        priority: 'normal',
        po_number: '',
        date: new Date().toISOString().split('T')[0],
        deadline_date: '',
        customer_id: '',
        branch_id: null
    });

    // Constants
    const DISPLAY_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

    // Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, prodRes] = await Promise.all([
                    customerService.getAll(),
                    productService.getAll()
                ]);
                setCustomers(Array.isArray(custRes.data) ? custRes.data : custRes.data?.data || []);
                setAllProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.data || []);
            } catch (err) {
                console.error('Failed to fetch data', err);
                setError('Failed to load initial data. Please refresh.');
            }
        };
        fetchData();
    }, []);

    // Filter products by selected customer
    const customerProducts = useMemo(() => {
        if (!orderDetails.customer_id) return [];
        return allProducts.filter(p => p.customer_id == orderDetails.customer_id);
    }, [allProducts, orderDetails.customer_id]);

    // Fetch Edit Data
    useEffect(() => {
        if (isEditMode && allProducts.length > 0) {
            const fetchOrder = async () => {
                setLoading(true);
                try {
                    const response = await orderService.getById(id);
                    const order = response.data || response;
                    
                    setOrderDetails({
                        priority: order.priority || 'normal',
                        po_number: order.po_number || '',
                        date: order.date || new Date().toISOString().split('T')[0],
                        deadline_date: order.deadline_date || '',
                        customer_id: order.customer_id || '',
                        branch_id: order.branch_id || ''
                    });

                    // Populate quantities from existing items
                    const newQuantities = {};
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const key = `${item.product_variant_id}-${item.size}`;
                            newQuantities[key] = (newQuantities[key] || 0) + item.quantity;
                        });
                        setQuantities(newQuantities);
                    }
                } catch (err) {
                    console.error(err);
                    setError('Failed to load order data');
                } finally {
                    setLoading(false);
                }
            };
            fetchOrder();
        }
    }, [id, isEditMode, allProducts]);

    // Auto-PO Logic
    useEffect(() => {
        let active = true;
        if (!isEditMode && orderDetails.customer_id && orderDetails.date) {
            const fetchPoNumber = async () => {
                setGeneratingPO(true);
                try {
                    const response = await api.post('/orders/generate-po-number', {
                        customer_id: orderDetails.customer_id,
                        date: orderDetails.date
                    });
                    if (active && response.data.success) {
                        setOrderDetails(prev => ({ ...prev, po_number: response.data.po_number }));
                    }
                } catch (error) {
                    console.error('Failed to generate PO', error);
                } finally {
                    if (active) {
                        setGeneratingPO(false);
                    }
                }
            };
            fetchPoNumber();
        }
        return () => {
            active = false;
        };
    }, [orderDetails.customer_id, orderDetails.date, isEditMode]);

    // Quantity Handlers
    const handleQuantityChange = (key, value) => {
        const val = parseInt(value);
        setQuantities(prev => {
            const next = { ...prev };
            if (!value || isNaN(val) || val <= 0) {
                delete next[key];
            } else {
                next[key] = val;
            }
            return next;
        });
    };

    // Prepare Matrix Data (1 row per variant)
    const matrixRows = useMemo(() => {
        const rows = [];
        const searchLower = searchQuery.toLowerCase();

        customerProducts.forEach(product => {
            product.variants?.forEach(variant => {
                // Search Filter
                if (
                    searchQuery && 
                    !product.name.toLowerCase().includes(searchLower) && 
                    !variant.name.toLowerCase().includes(searchLower)
                ) {
                    return;
                }

                rows.push({
                    id: `${product.id}-${variant.id}`,
                    product,
                    variant,
                    colorScheme: (variant.colors || '').split(',').map(s => s.trim()).filter(Boolean)
                });
            });
        });
        return rows;
    }, [customerProducts, searchQuery]);

    // Calculate Total Items
    const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

    // Save Handlers
    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            // Transform quantities to items array
            const items = [];
            Object.entries(quantities).forEach(([key, qty]) => {
                const firstDashIdx = key.indexOf('-');
                const variantId = key.substring(0, firstDashIdx);
                const size = key.substring(firstDashIdx + 1);
                
                // Find the variant to get color scheme
                let colorScheme = '';
                for (const p of customerProducts) {
                    const v = p.variants?.find(v => v.id == variantId);
                    if (v) {
                        colorScheme = v.colors || 'Standard';
                        break;
                    }
                }

                items.push({
                    product_variant_id: variantId,
                    color: colorScheme, // Store the full color scheme as info
                    size,
                    quantity: qty
                });
            });

            if (items.length === 0) {
                setError('Please add at least one item');
                setSaving(false);
                setShowReview(false);
                return;
            }

            const payload = {
                ...orderDetails,
                items
            };

            if (isEditMode) {
                await orderService.update(id, payload);
            } else {
                await orderService.create(payload);
            }
            navigate('/admin/orders');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save order');
            setSaving(false);
            setShowReview(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-primary" size={40}/></div>;

    return (
        <div className="flex flex-col h-full min-h-screen bg-slate-50/50 pb-24">
            
            {/* Top Bar / Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 py-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-2xl font-light text-slate-800 tracking-tight">
                                {isEditMode ? 'Edit Order' : 'New Bulk Order'}
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">Select customer to view their products, then fill in quantities.</p>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="text-right">
                                <span className={`block text-xs font-bold uppercase ${orderDetails.priority === 'urgent' ? 'text-rose-500' : 'text-slate-400'}`}>Priority</span>
                                <div className="flex bg-slate-100/50 rounded-xl p-1 gap-1 border border-slate-100">
                                    {[
                                        { id: 'normal', color: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', shadow: 'shadow-blue-200' },
                                        { id: 'high', color: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', shadow: 'shadow-orange-200' },
                                        { id: 'urgent', color: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', shadow: 'shadow-rose-200' }
                                    ].map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setOrderDetails(prev => ({ ...prev, priority: p.id }))}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all duration-300 ${
                                                orderDetails.priority === p.id 
                                                ? `${p.color} text-white shadow-lg ${p.shadow} scale-105`
                                                : `text-slate-400 hover:${p.text} hover:${p.bg}`
                                            }`}
                                        >
                                            {p.id}
                                        </button>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2 relative z-30">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</label>
                            <select
                                value={orderDetails.customer_id}
                                onChange={(e) => {
                                    setOrderDetails(prev => ({ ...prev, customer_id: e.target.value }));
                                    setQuantities({}); // Reset quantities when customer changes
                                }}
                                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="">Select Customer...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PO Number</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={orderDetails.po_number}
                                    onChange={(e) => setOrderDetails(prev => ({ ...prev, po_number: e.target.value }))}
                                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                    placeholder="Auto-generated"
                                />
                                {generatingPO && <Loader2 className="absolute right-2 top-2.5 animate-spin text-primary" size={16} />}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
                                <input
                                    type="date"
                                    value={orderDetails.date}
                                    onChange={(e) => setOrderDetails(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                             </div>
                             <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deadline</label>
                                <input
                                    type="date"
                                    value={orderDetails.deadline_date || ''}
                                    onChange={(e) => setOrderDetails(prev => ({ ...prev, deadline_date: e.target.value }))}
                                    className="w-full h-10 px-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                             </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Matrix Table */}
            <main className="flex-grow max-w-[1400px] w-full mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}

                {!orderDetails.customer_id ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">Select a Customer</h3>
                        <p className="text-sm text-slate-400">Choose a customer above to view their available products.</p>
                    </div>
                ) : customerProducts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600 mb-2">No Products Found</h3>
                        <p className="text-sm text-slate-400">This customer has no products assigned yet.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search products or variants..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <div className="text-xs text-slate-500">
                                {customerProducts.length} products • {matrixRows.length} variants
                            </div>
                        </div>

                        {/* Scrolling Table */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="py-3 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[25%] bg-slate-50">Product / Variant</th>
                                        <th className="py-3 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-[20%] bg-slate-50">Color Scheme</th>
                                        {DISPLAY_SIZES.map(size => (
                                            <th key={size} className="py-3 px-2 text-center text-[10px] font-bold text-slate-500 uppercase bg-slate-50 w-[8%]">{size}</th>
                                        ))}
                                        <th className="py-3 px-6 text-right text-[10px] font-bold text-slate-500 uppercase bg-slate-50">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {matrixRows.map(row => {
                                        const availableSizes = (row.variant.sizes || '').split(',').map(s => s.trim());
                                        
                                        // Calculate row subtotal
                                        let rowSubtotal = 0;
                                        DISPLAY_SIZES.forEach(size => {
                                            const key = `${row.variant.id}-${size}`;
                                            rowSubtotal += (quantities[key] || 0);
                                        });

                                        return (
                                            <tr key={row.id} className={`group transition-colors ${rowSubtotal > 0 ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                                                <td className="py-3 px-6">
                                                    <div className="font-semibold text-slate-700">{row.product.name}</div>
                                                    <div className="text-xs text-slate-400 font-medium">{row.variant.name}</div>
                                                </td>
                                                <td className="py-3 px-6">
                                                    <div className="flex flex-wrap gap-1">
                                                        {row.colorScheme.length > 0 ? row.colorScheme.map((color, idx) => {
                                                            const hex = nameToHex(color);
                                                            return (
                                                                <span 
                                                                    key={idx} 
                                                                    className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border border-black/5 shadow-sm"
                                                                    style={{ 
                                                                        backgroundColor: hex,
                                                                        color: getContrastColor(hex)
                                                                    }}
                                                                >
                                                                    {color}
                                                                </span>
                                                            );
                                                        }) : (
                                                            <span className="text-xs text-slate-300 italic">No colors defined</span>
                                                        )}
                                                    </div>
                                                </td>
                                                {DISPLAY_SIZES.map(size => {
                                                    const isAvailable = availableSizes.includes(size) || availableSizes.length === 0 || (availableSizes.length === 1 && availableSizes[0] === '');
                                                    const key = `${row.variant.id}-${size}`;
                                                    const qty = quantities[key] || '';

                                                    return (
                                                        <td key={size} className="py-3 px-2 text-center">
                                                            {isAvailable ? (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="-"
                                                                    className={`w-full h-9 rounded-md text-center text-sm font-medium transition-all focus:ring-2 focus:ring-primary/50 focus:z-10 ${qty ? 'bg-white border border-indigo-200 text-indigo-600 font-bold' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100'}`}
                                                                    value={qty}
                                                                    onChange={(e) => handleQuantityChange(key, e.target.value)}
                                                                />
                                                            ) : (
                                                                <div className="w-full h-8 flex items-center justify-center">
                                                                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="py-3 px-6 text-right font-mono font-bold text-slate-600">
                                                    {rowSubtotal > 0 ? rowSubtotal : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {matrixRows.length === 0 && (
                                        <tr>
                                            <td colSpan={3 + DISPLAY_SIZES.length} className="py-20 text-center text-slate-400">
                                                No products found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Footer */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 z-30 ${totalItems > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-[1400px] mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-2xl font-black text-xs border border-indigo-100 shadow-sm">
                            TOTAL ITEMS <span className="text-xl ml-2 font-black tracking-tight">{totalItems.toLocaleString()}</span> <span className="opacity-60 ml-1 font-bold">PCS</span>
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <Check size={12} strokeWidth={3} /> Ready to Review
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <button
                            onClick={() => navigate('/admin/orders')}
                            className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center gap-2"
                        >
                            <X size={18} /> Cancel
                        </button>
                        <button
                            onClick={() => setShowReview(true)}
                            disabled={!orderDetails.po_number || !orderDetails.customer_id}
                            className="bg-primary hover:bg-blue-600 text-white px-10 py-3.5 rounded-2xl font-black shadow-xl shadow-primary/25 transition-all flex items-center gap-3 disabled:opacity-50 disabled:shadow-none active:scale-95"
                        >
                            Review Order 
                            <div className="bg-white/20 p-1 rounded-lg">
                                <ArrowRight size={18} strokeWidth={3} />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Review Modal Overlay */}
            {showReview && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setShowReview(false)}></div>
                    
                    {/* Drawer Panel */}
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">Order Summary</h2>
                            <button onClick={() => setShowReview(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Summary Details */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">PO Number</span>
                                    <span className="font-medium text-slate-800">{orderDetails.po_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Customer</span>
                                    <span className="font-medium text-slate-800">{customers.find(c => c.id == orderDetails.customer_id)?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-medium text-slate-800">{orderDetails.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total Quantity</span>
                                    <span className="font-bold text-indigo-600">{totalItems} pcs</span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Items Detail</h3>
                                <div className="space-y-3">
                                    {Object.entries(quantities).map(([key, qty]) => {
                                        const firstDashIdx = key.indexOf('-');
                                        const varId = key.substring(0, firstDashIdx);
                                        const size = key.substring(firstDashIdx + 1);
                                        
                                        let productName = '', variantName = '', colorScheme = '';
                                        for (const p of customerProducts) {
                                            const v = p.variants?.find(v => v.id == varId);
                                            if (v) {
                                                productName = p.name;
                                                variantName = v.name;
                                                colorScheme = v.colors || '';
                                                break;
                                            }
                                        }
                                        
                                        return (
                                            <div key={key} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm">{productName}</div>
                                                    <div className="text-xs text-slate-400">{variantName} • Size {size}</div>
                                                    {colorScheme && <div className="text-[10px] text-slate-400 mt-1">Colors: {colorScheme}</div>}
                                                </div>
                                                <div className="font-bold text-indigo-600">{qty}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                {isEditMode ? 'Confirm & Update Order' : 'Confirm & Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderWizard;
