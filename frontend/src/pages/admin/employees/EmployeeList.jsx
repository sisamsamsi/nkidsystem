import React, { useState, useEffect, useCallback } from "react";
import {
    Users, Plus, Search, Pencil, Trash2, Key, Loader2, 
    AlertCircle, User, Mail, ChevronLeft, ChevronRight
} from "lucide-react";
import EmployeeModal from "../../../components/admin/employees/EmployeeModal";
import api from "../../../lib/axios";

const EmployeeList = () => {
    // --- State ---
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchVal, setSearchVal] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchTerm(searchVal);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchVal]);

    // --- API Calls ---
    const fetchEmployees = useCallback(async (page = 1) => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get(`/users`, {
                params: {
                    page,
                    search: searchTerm || undefined
                }
            });
            const data = response.data;
            setEmployees(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0
            });
        } catch (err) {
            setError("Failed to fetch employees.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // --- Handlers ---
    const handleAdd = () => {
        setSelectedEmployee(null);
        setIsModalOpen(true);
    };

    const handleEdit = (employee) => {
        setSelectedEmployee(employee);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmId || isDeleting) return;
        setIsDeleting(true);
        try {
            await api.delete(`/users/${deleteConfirmId}`);
            fetchEmployees(pagination.current_page);
            setDeleteConfirmId(null);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete user.");
            setDeleteConfirmId(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // --- UI Helpers ---
    const getAvatarColor = (name) => {
        const colors = [
            'bg-indigo-50 text-indigo-600', 
            'bg-emerald-50 text-emerald-600', 
            'bg-rose-50 text-rose-600', 
            'bg-amber-50 text-amber-600', 
            'bg-sky-50 text-sky-600',
            'bg-violet-50 text-violet-600'
        ];
        const index = name ? name.length % colors.length : 0;
        return colors[index];
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case "admin":
                return (
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-purple-50 text-purple-600 border border-purple-100 shadow-sm shadow-purple-50/50">
                        Administrator
                    </span>
                );
            case "qc":
                return (
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm shadow-amber-50/50">
                        Quality Control
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 shadow-sm shadow-blue-50/50">
                        Operator
                    </span>
                );
        }
    };

    const getDivisionStyle = (division) => {
        if (!division) return 'bg-slate-50 text-slate-500 border-slate-100';
        const div = division.toLowerCase();
        if (div.includes('sewing')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (div.includes('cutting')) return 'bg-sky-50 text-sky-600 border-sky-100';
        if (div.includes('sablon')) return 'bg-violet-50 text-violet-600 border-violet-100';
        if (div.includes('finishing')) return 'bg-fuchsia-100/50 text-fuchsia-600 border-fuchsia-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-light text-slate-800 tracking-tight">Kelola Akun & Karyawan</h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">Manajemen akun pengguna, level akses, dan penugasan divisi stasiun</p>
                </div>
                <button 
                    onClick={handleAdd}
                    className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black transition-all shadow-xl shadow-primary/20 active:scale-95 text-xs uppercase tracking-widest"
                >
                    <Plus size={18} strokeWidth={3} />
                    Tambah Akun / Karyawan
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col min-h-[600px]">
                {/* Search & Filter Bar */}
                <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/30">
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Cari berdasarkan nama, email, atau divisi..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-slate-400 shadow-sm font-medium"
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Memuat database...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-96 text-rose-500 gap-3">
                            <AlertCircle size={40} />
                            <p className="font-bold">{error}</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                                <Users size={40} />
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest">Data tidak ditemukan</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profil Pengguna</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Level Akses / Role</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Divisi Utama</th>
                                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">PIN Stasiun</th>
                                    <th className="py-4 px-8 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                        <td className="py-4 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shadow-sm border border-black/5 ${getAvatarColor(emp.name)}`}>
                                                    {(emp.name || '??').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-700 group-hover:text-primary transition-colors tracking-tight">{emp.name}</div>
                                                    <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                                        <Mail size={12} className="text-slate-300" />
                                                        {emp.email || '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            {getRoleBadge(emp.role)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getDivisionStyle(emp.division)}`}>
                                                {emp.division || "General"}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {emp.is_station ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 text-indigo-600 rounded-xl font-mono font-black border border-indigo-100 shadow-sm text-xs">
                                                    <Key size={12} strokeWidth={3} />
                                                    {emp.pin_code ? "••••••" : "------"}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 font-bold">-</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-8">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(emp)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-white hover:shadow-md rounded-xl transition-all"
                                                    title="Edit Pengguna"
                                                    aria-label={`Edit ${emp.name || 'Pengguna'}`}
                                                >
                                                    <Pencil size={18} strokeWidth={2.5} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(emp.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Hapus Pengguna"
                                                    aria-label={`Hapus ${emp.name || 'Pengguna'}`}
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
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
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Menampilkan <span className="text-slate-700">{employees.length}</span> dari <span className="text-slate-700">{pagination.total}</span> akun
                    </p>
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                        <button 
                            onClick={() => fetchEmployees(pagination.current_page - 1)}
                            disabled={pagination.current_page <= 1}
                            className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all text-slate-400"
                        >
                            <ChevronLeft size={18} strokeWidth={3} />
                        </button>
                        <div className="px-4 py-1.5 rounded-xl text-xs font-black text-primary bg-primary/5">
                            {pagination.current_page} <span className="mx-1 opacity-30 font-bold">/</span> {pagination.last_page}
                        </div>
                        <button 
                            onClick={() => fetchEmployees(pagination.current_page + 1)}
                            disabled={pagination.current_page >= pagination.last_page}
                            className="p-2 rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-all text-slate-400"
                        >
                            <ChevronRight size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <EmployeeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                employee={selectedEmployee}
                onSuccess={() => fetchEmployees(pagination.current_page)}
            />

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
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
                        <p className="text-sm text-slate-500 mb-6">Apakah Anda yakin ingin menghapus akun/karyawan ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.</p>
                        
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => !isDeleting && setDeleteConfirmId(null)}
                                disabled={isDeleting}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-rose-200 disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isDeleting ? 'Menghapus...' : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeList;
