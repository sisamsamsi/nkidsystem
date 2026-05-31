import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Plus, Search, Filter, Mail, Phone, Pencil, Trash2, X, 
    ChevronLeft, ChevronRight, Loader2, AlertCircle, 
    User, MapPin, Building2, ExternalLink
} from 'lucide-react';
import { customerService } from '../../../services/customerService';

const CustomerList = () => {
    // --- State ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    
    const [formData, setFormData] = useState({ 
        name: '', 
        code: '', 
        brand: '', 
        email: '', 
        phone: '', 
        address: '' 
    });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

    // --- Helpers ---
    const generateCustomerCode = (name) => {
        if (!name) return '';
        // Extract all consonants, case insensitive
        const consonants = name.replace(/[aeiou\s\W\d]/gi, '');
        // Take first 3, uppercase
        return consonants.substring(0, 3).toUpperCase();
    };

    // --- API Calls ---
    const fetchCustomers = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { 
                page, 
                search: searchTerm || undefined, 
                status: statusFilter !== 'all' ? statusFilter : undefined 
            };
            const response = await customerService.getAll(params);
            const data = response.data || response;
            setCustomers(Array.isArray(data) ? data : data.data || []);
            
            if (data.meta || data.current_page) {
                setPagination({
                    current_page: data.meta?.current_page || data.current_page || 1,
                    last_page: data.meta?.last_page || data.last_page || 1,
                    total: data.meta?.total || data.total || 0
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load customers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // --- Handlers ---
    const handleNameChange = (e) => {
        const newName = e.target.value;
        setFormData(prev => {
            const updates = { ...prev, name: newName };
            // Auto-generate code if it was empty or matched the previous auto-generated one
            const currentCode = prev.code;
            const prevAutoCode = generateCustomerCode(prev.name);
            
            if (!currentCode || currentCode === prevAutoCode) {
                updates.code = generateCustomerCode(newName);
            }
            return updates;
        });
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                name: customer.name || '',
                code: customer.code || '',
                brand: customer.brand || '',
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || ''
            });
        } else {
            setEditingCustomer(null);
            setFormData({ name: '', code: '', brand: '', email: '', phone: '', address: '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingCustomer) {
                await customerService.update(editingCustomer.id, formData);
            } else {
                await customerService.create(formData);
            }
            handleCloseModal();
            fetchCustomers(pagination.current_page);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save customer');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await customerService.delete(id);
            fetchCustomers(pagination.current_page);
        } catch (err) {
            setError('Failed to delete customer');
        }
    };

    // --- Styles ---
    const getAvatarColor = (name) => {
        const colors = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-rose-100 text-rose-600', 'bg-amber-100 text-amber-600', 'bg-sky-100 text-sky-600'];
        const index = name ? name.length % colors.length : 0;
        return colors[index];
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light text-slate-800 tracking-tight">Customers</h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">Client database and brand management</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-primary/10 active:scale-95 text-sm"
                >
                    <Plus size={18} />
                    New Customer
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
                            placeholder="Search by name, code, or brand..."
                            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 shadow-sm transition-colors">
                            <Filter size={16} className="text-slate-400" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-transparent border-none p-0 focus:ring-0 text-sm cursor-pointer outline-none"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
                            <Building2 size={48} className="text-slate-200" />
                            <p className="text-sm">No customers found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Code</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</th>
                                    <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</th>
                                    <th className="py-4 px-6 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${getAvatarColor(customer.name)}`}>
                                                    {(customer.name || '??').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-slate-700 group-hover:text-primary transition-colors">{customer.name}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10} />
                                                        {customer.address ? (customer.address.substring(0, 30) + (customer.address.length > 30 ? '...' : '')) : 'No address'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-widest border shadow-sm ${
                                                (customer.code || '').length % 2 === 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {customer.code || '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Building2 size={14} className="text-slate-400" />
                                                {customer.brand || '-'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1.5">
                                                {customer.email && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-primary transition-colors">
                                                        <Mail size={12} className="text-slate-300" />
                                                        {customer.email}
                                                    </div>
                                                )}
                                                {customer.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <Phone size={12} className="text-slate-300" />
                                                        {customer.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleOpenModal(customer)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                    title="Edit Customer"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Delete Customer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="p-5 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/10">
                    <p className="text-xs font-medium text-slate-400">
                        Showing <span className="text-slate-700">{customers.length}</span> of <span className="text-slate-700">{pagination.total}</span> customers
                    </p>
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        <button 
                            onClick={() => fetchCustomers(pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1}
                            className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all text-slate-400"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="px-4 py-1.5 rounded-xl text-xs font-black text-primary bg-primary/5">
                            {pagination.current_page} <span className="mx-1 opacity-30">/</span> {pagination.last_page}
                        </div>
                        <button 
                            onClick={() => fetchCustomers(pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.last_page}
                            className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all text-slate-400"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal - Modern Overlay Style */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300" onClick={handleCloseModal}></div>
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{editingCustomer ? 'Edit Customer' : 'Register New Customer'}</h3>
                                <p className="text-xs text-slate-400 mt-1">Complete the information below to {editingCustomer ? 'update' : 'create'} a client record.</p>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                {error && (
                                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Customer Name *</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input 
                                                type="text" 
                                                required
                                                value={formData.name}
                                                onChange={handleNameChange}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300" 
                                                placeholder="e.g. Little Steps Boutique" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                                            Brand Name
                                            <Building2 size={12} className="text-slate-300" />
                                        </label>
                                        <input 
                                            type="text" 
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300" 
                                            placeholder="e.g. StepKids" 
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between text-indigo-500">
                                            Auto-Code 
                                            <span className="text-[9px] lowercase italic font-normal text-slate-400">(3 Consonants)</span>
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                className="w-full px-4 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-mono" 
                                                placeholder="LSB" 
                                            />
                                            {formData.code && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 bg-white rounded-md p-0.5">
                                                    <Loader2 className={saving ? "animate-spin" : ""} size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input 
                                                type="email" 
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300" 
                                                placeholder="hello@brand.com" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                            <input 
                                                type="text" 
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300" 
                                                placeholder="+62 xxx" 
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                                            Official Address
                                            <MapPin size={12} className="text-slate-300" />
                                        </label>
                                        <textarea 
                                            rows="3" 
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-300 resize-none" 
                                            placeholder="Enter complete office address..."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
                                <button 
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    Discard Changes
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="bg-primary hover:bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-xl shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {saving && <Loader2 className="animate-spin" size={18} />}
                                    {editingCustomer ? 'Update Client' : 'Add Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
