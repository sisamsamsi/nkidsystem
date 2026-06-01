import React, { useState, useEffect } from 'react';
import { X, Save, Key, User, Shield, Briefcase, Info, Loader2, Mail, Lock, CheckCircle2 } from 'lucide-react';
import api from '../../../lib/axios';

const EmployeeModal = ({ isOpen, onClose, employee, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        pin_code: '',
        role: 'operator',
        division: '',
        is_station: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (employee) {
                setFormData({
                    name: employee.name || '',
                    email: employee.email || '',
                    password: '', // Password always blank for edit
                    pin_code: employee.pin_code || '',
                    role: employee.role || 'operator',
                    division: employee.division || '',
                    is_station: employee.is_station || false
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    pin_code: '',
                    role: 'operator',
                    division: '',
                    is_station: false
                });
            }
            setError('');
        }
    }, [isOpen, employee]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (employee) {
                await api.put(`/users/${employee.id}`, formData);
            } else {
                await api.post('/users', formData);
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save employee data.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-500" onClick={onClose}></div>
            
            <div className="relative z-10 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-white/20">
                {/* Decorative Background Accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>

                <header className="relative flex items-center justify-between px-8 py-5 shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">
                            {employee ? 'Edit Employee' : 'Add Employee'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Human Resource Management</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all hover:rotate-90">
                        <X size={20} strokeWidth={3} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="relative flex flex-col max-h-[85vh]">
                    <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-6 scrollbar-hide">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
                                <Info size={18} className="shrink-0" strokeWidth={3} />
                                {error}
                            </div>
                        )}

                        {/* Profile Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <User size={12} strokeWidth={3} />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Basic Information</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <User size={16} strokeWidth={2.5} />
                                        </div>
                                        <input 
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-slate-700 text-sm"
                                            placeholder="Full Name..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee Email</label>
                                    <div className="relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                                            <Mail size={16} strokeWidth={2.5} />
                                        </div>
                                        <input 
                                            type="email"
                                            required={formData.role === 'admin'}
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="w-full h-11 pl-11 pr-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-slate-700 text-sm"
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role & Division Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                                    <Briefcase size={12} strokeWidth={3} />
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assignment & Security</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 text-left">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Level (Role)</label>
                                    <div className="relative">
                                        <select 
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-black text-slate-700 appearance-none uppercase text-[10px] tracking-widest"
                                        >
                                            <option value="operator">Operator</option>
                                            <option value="qc">Quality Control (QC)</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                            <Info size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Main Division</label>
                                    <input 
                                        type="text"
                                        value={formData.division}
                                        onChange={(e) => setFormData({...formData, division: e.target.value})}
                                        className="w-full h-11 px-4 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none font-bold text-slate-700 text-sm"
                                        placeholder="Sewing, Cutting..."
                                    />
                                </div>

                                {formData.role === 'admin' && (
                                    <div className="md:col-span-2 space-y-1.5 animate-in slide-in-from-right-4 duration-300">
                                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                            <Lock size={10} strokeWidth={3} />
                                            New Password {employee && "(Optional)"}
                                        </label>
                                        <input 
                                            type="password"
                                            required={!employee}
                                            value={formData.password}
                                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                                            className="w-full h-11 px-5 bg-rose-50/30 border border-rose-100 rounded-xl focus:ring-4 focus:ring-rose-500/5 focus:border-rose-300 transition-all outline-none font-bold text-slate-700 text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Station Mode Toggle Section */}
                        <div className="p-5 rounded-[1.5rem] bg-indigo-50/50 border border-indigo-100/50 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${formData.is_station ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-400'}`}>
                                        <Shield size={18} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">Login Station Device</p>
                                        <p className="text-[9px] font-bold text-indigo-500/80 uppercase tracking-widest mt-0.5">Workstation terminal access</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={formData.is_station}
                                        onChange={(e) => setFormData({...formData, is_station: e.target.checked})}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                </label>
                            </div>

                            {formData.is_station && (
                                <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                                    <div className="h-px bg-indigo-100/50 w-full"></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                                        <div className="space-y-0.5">
                                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                <Key size={10} strokeWidth={3} />
                                                6-Digit PIN
                                            </label>
                                            <p className="text-[9px] text-slate-400 font-medium">Workstation login PIN.</p>
                                        </div>
                                        <input 
                                            type="text"
                                            maxLength={6}
                                            required
                                            value={formData.pin_code}
                                            onChange={(e) => setFormData({...formData, pin_code: e.target.value.replace(/\D/g, '')})}
                                            className="w-full sm:w-40 h-11 px-4 bg-white border border-indigo-100 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-indigo-600 font-black tracking-[0.5em] text-center text-lg shadow-inner placeholder:text-indigo-100"
                                            placeholder="000000"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex gap-4 shrink-0">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl font-black text-[10px] text-slate-400 uppercase tracking-widest border border-slate-100 hover:bg-white hover:shadow-sm transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-11 bg-indigo-600 hover:bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 active:scale-95 transition-all disabled:bg-slate-300"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} strokeWidth={3} /> : <Save size={16} strokeWidth={3} />}
                            {employee ? 'Save' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EmployeeModal;
