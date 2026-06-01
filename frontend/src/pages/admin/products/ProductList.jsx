import React, { useState, useEffect, useCallback } from 'react';
import { 
    Plus, Search, Filter, Pencil, Trash2, ChevronLeft, 
    ChevronRight, Loader2, AlertCircle, Package,
    Layers, X, Image, ChevronDown, ChevronUp, Save, Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { productService, productVariantService } from '../../../services/productService';
import { getColorBlockStyle } from '../../../lib/colorblock';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    
    // New state for dropdown and edit functionality
    const [expandedProductId, setExpandedProductId] = useState(null);
    const [editingVariant, setEditingVariant] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', colors: '', price: '' });
    const [saving, setSaving] = useState(false);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const fetchProducts = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { 
                page, 
                search: debouncedSearchTerm || undefined 
            };
            const response = await productService.getAll(params);
            const data = response.data || response;
            
            const items = Array.isArray(data) ? data : data.data || [];
            setProducts(items);
            
            const meta = data.meta || data;
            if (meta.current_page) {
                setPagination({
                    current_page: meta.current_page || 1,
                    last_page: meta.last_page || 1,
                    total: meta.total || items.length
                });
            }
        } catch (err) {
            setError('Failed to load products');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await productService.delete(deleteConfirmId);
            fetchProducts(pagination.current_page);
            setDeleteConfirmId(null);
        } catch (err) {
            setError('Failed to delete product');
            setDeleteConfirmId(null);
        }
    };

    // Toggle product dropdown
    const toggleProductExpand = (productId) => {
        setExpandedProductId(expandedProductId === productId ? null : productId);
        setEditingVariant(null); // Reset editing state when toggling
    };

    // Start editing a variant
    const startEditVariant = (variant, e) => {
        e.stopPropagation();
        setEditingVariant(variant.id);
        setEditForm({
            name: variant.name || '',
            colors: variant.colors || '',
            price: variant.price || ''
        });
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingVariant(null);
        setEditForm({ name: '', colors: '', price: '' });
    };

    // Save variant changes
    const saveVariant = async (variantId) => {
        setSaving(true);
        try {
            await productVariantService.update(variantId, editForm);
            // Refresh products to get updated data
            await fetchProducts(pagination.current_page);
            setEditingVariant(null);
            setEditForm({ name: '', colors: '', price: '' });
        } catch (err) {
            console.error('Failed to update variant:', err);
            setError('Failed to update variant');
        } finally {
            setSaving(false);
        }
    };

    // Helper for pastel product icons
    const getProductColor = (name) => {
        const colors = [
            'bg-blue-100 text-blue-600', 
            'bg-purple-100 text-purple-600', 
            'bg-rose-100 text-rose-600', 
            'bg-amber-100 text-amber-600', 
            'bg-emerald-100 text-emerald-600'
        ];
        const index = name ? name.length % colors.length : 0;
        return colors[index];
    };

    // Render variant row (for dropdown)
    const renderVariantRows = (product) => {
        if (expandedProductId !== product.id) return null;
        
        const variants = product.variants || [];
        
        if (variants.length === 0) {
            return (
                <tr className="bg-slate-50/50">
                    <td colSpan={5} className="py-6 px-6">
                        <div className="flex items-center justify-center text-slate-400 text-sm">
                            <Package size={16} className="mr-2 opacity-50" />
                            No variants defined for this product
                        </div>
                    </td>
                </tr>
            );
        }

        return (
            <tr className="bg-gradient-to-b from-slate-50/80 to-white">
                <td colSpan={5} className="p-0">
                    <div className="px-6 py-4 pl-20 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {variants.map((variant) => (
                            <div 
                                key={variant.id}
                                className="flex items-center gap-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                            >
                                {/* Variant Thumbnail */}
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden flex-shrink-0 border border-slate-200">
                                    {variant.image_url ? (
                                        <img 
                                            src={variant.image_url} 
                                            alt={variant.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Image size={20} className="text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Variant Info or Edit Form */}
                                {editingVariant === variant.id ? (
                                    // Edit Form
                                    <div className="flex-1 flex items-center gap-3">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                placeholder="Variant name"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                autoFocus
                                            />
                                            <input
                                                type="text"
                                                value={editForm.colors}
                                                onChange={(e) => setEditForm({ ...editForm, colors: e.target.value })}
                                                placeholder="Colors (comma separated)"
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500">Rp</span>
                                                <input
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                    placeholder="Price per unit"
                                                    className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => saveVariant(variant.id)}
                                                disabled={saving}
                                                className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Display Mode
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-bold text-slate-700 text-sm truncate">{variant.name}</h4>
                                                {variant.price && (
                                                    <span className="text-sm font-semibold text-emerald-600">
                                                        Rp {Number(variant.price).toLocaleString('id-ID')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                <Palette size={12} className="text-slate-400 mt-0.5" />
                                                {(typeof variant.colors === 'string' 
                                                    ? variant.colors.split(',') 
                                                    : variant.colors || []
                                                ).map((color, i) => {
                                                    const colorStyle = getColorBlockStyle(color);
                                                    return (
                                                        <span 
                                                            key={i} 
                                                            className="px-2 py-0.5 text-[10px] font-medium rounded-md shadow-sm"
                                                            style={{
                                                                backgroundColor: colorStyle.bg,
                                                                color: colorStyle.text,
                                                                borderWidth: '1px',
                                                                borderStyle: 'solid',
                                                                borderColor: colorStyle.border,
                                                            }}
                                                        >
                                                            {color.trim()}
                                                        </span>
                                                    );
                                                })}
                                                {(!variant.colors || variant.colors.length === 0) && (
                                                    <span className="text-[11px] text-slate-400 italic">No colors defined</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Edit Button */}
                                        <button
                                            onClick={(e) => startEditVariant(variant, e)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Edit Variant"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light text-slate-800 tracking-tight">Products</h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">Garment catalog and variant management</p>
                </div>
                <button 
                    onClick={() => navigate('/admin/products/new')}
                    className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-primary/10 active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col min-h-[600px]">
                {/* Search & Filter Bar */}
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search products by name or style code..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && fetchProducts(1)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
                            <Filter size={16} className="text-slate-400" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
                            <Package size={48} className="text-slate-200" />
                            <div className="text-center">
                                <p className="text-sm font-medium">No products found</p>
                                <p className="text-xs text-slate-400 mt-1">Start by adding a new product to your catalog.</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Info</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Style Code</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Variants</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {products.map((product) => (
                                    <React.Fragment key={product.id}>
                                        <tr className="group hover:bg-slate-50/80 transition-all duration-200">
                                            <td className="py-4 px-6">
                                                <div 
                                                    className="flex items-center gap-3 cursor-pointer"
                                                    onClick={() => toggleProductExpand(product.id)}
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${getProductColor(product.name)}`}>
                                                        <Package size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-primary hover:text-blue-600 transition-colors">
                                                                {product.name}
                                                            </span>
                                                            {expandedProductId === product.id ? (
                                                                <ChevronUp size={16} className="text-slate-400" />
                                                            ) : (
                                                                <ChevronDown size={16} className="text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                                            <Layers size={10} />
                                                            {product.variants?.length || 0} Variants defined
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {(product.customer?.name || '?').substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-slate-600 font-medium">
                                                        {product.customer?.name || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100 font-mono shadow-sm">
                                                    {product.style_code || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                                                    {product.variants && product.variants.length > 0 ? (
                                                        product.variants.slice(0, 3).map((v) => {
                                                            const colorStyle = getColorBlockStyle(v.name);
                                                            return (
                                                                <span 
                                                                    key={v.id}
                                                                    className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-tight shadow-sm"
                                                                    style={{
                                                                        backgroundColor: colorStyle.bg,
                                                                        color: colorStyle.text,
                                                                        borderWidth: '1px',
                                                                        borderStyle: 'solid',
                                                                        borderColor: colorStyle.border,
                                                                    }}
                                                                >
                                                                    {v.name}
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-[11px] text-slate-300 italic">No variants</span>
                                                    )}
                                                    {product.variants && product.variants.length > 3 && (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                            +{product.variants.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => navigate(`/admin/products/${product.id}`)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        title="Edit Product"
                                                        aria-label={`Edit ${product.name || 'Product'}`}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(product.id)}
                                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        title="Delete Product"
                                                        aria-label={`Delete ${product.name || 'Product'}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Variant Dropdown Rows */}
                                        {renderVariantRows(product)}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="p-5 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/10">
                    <p className="text-xs font-medium text-slate-400">
                        Showing <span className="text-slate-700">{products.length}</span> of <span className="text-slate-700">{pagination.total}</span> products
                    </p>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => fetchProducts(pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                            {pagination.current_page} / {pagination.last_page}
                        </div>
                        <button 
                            onClick={() => fetchProducts(pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.last_page}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <div className="fixed bottom-4 right-4 bg-rose-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => setError('')} className="ml-2 p-1 hover:bg-white/20 rounded-lg">
                        <X size={14} />
                    </button>
                </div>
            )}
            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={() => setDeleteConfirmId(null)}></div>
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 p-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Delete</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this product? This action is permanent and cannot be undone.</p>
                        
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-rose-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
