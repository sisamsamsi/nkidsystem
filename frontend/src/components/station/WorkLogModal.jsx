import React, { useState, useEffect } from 'react';
import { 
    X, Delete, Check, CheckCircle, ChevronDown, ClipboardList, Loader2, AlertCircle
} from 'lucide-react';
import { stationService } from '../../services/stationService';
import api from '../../lib/axios';

const WorkLogModal = ({ isOpen, onClose, task, onSuccess }) => {
    const [employeeId, setEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [quantity, setQuantity] = useState('0');
    const [notes, setNotes] = useState('');
    const [activeField, setActiveField] = useState('quantity'); // 'quantity' or 'pin'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [employees, setEmployees] = useState([]);

    // Fetch employees and reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setEmployeeId('');
            setPin('');
            setQuantity('0');
            setNotes('');
            setActiveField('quantity');
            setError('');
            
            // Fetch operators
            api.get('/users?role=operator').then(res => {
                setEmployees(res.data.data || res.data || []);
            }).catch((err) => {
                console.error('Fetch operators error:', err);
                setError('Gagal memuat daftar operator dari server. Silakan hubungi admin.');
                setEmployees([]);
            });
        }
    }, [isOpen]);

    // Batch mode detection
    const isBatchMode = Array.isArray(task);
    const tasks = isBatchMode ? task : (task ? [task] : []);
    const firstTask = tasks[0];

    if (!isOpen || tasks.length === 0) return null;

    const handleNumpadClick = (value) => {
        if (activeField === 'quantity') {
            setQuantity(prev => {
                if (prev === '0') return value.toString();
                return prev + value;
            });
        } else if (activeField === 'pin') {
            if (pin.length < 6) {
                setPin(prev => prev + value);
            }
        }
    };

    const handleBackspace = () => {
        if (activeField === 'quantity') {
            setQuantity(prev => {
                if (prev.length <= 1) return '0';
                return prev.slice(0, -1);
            });
        } else if (activeField === 'pin') {
            setPin(prev => prev.slice(0, -1));
        }
    };

    const handleClear = () => {
        if (activeField === 'quantity') {
            setQuantity('0');
        } else if (activeField === 'pin') {
            setPin('');
        }
    };

    const handleSubmit = async () => {
        if (!employeeId || pin.length !== 6 || quantity === '0') return;
        
        const qtyNum = parseInt(quantity);
        if (isNaN(qtyNum) || qtyNum <= 0) {
            setError('Jumlah kuantitas tidak valid.');
            return;
        }

        // Limit validation for non-batch mode
        if (!isBatchMode) {
            const remainingQty = firstTask.total - firstTask.completed;
            if (qtyNum > remainingQty) {
                setError(`Jumlah tidak boleh melebihi sisa target (${remainingQty} pcs)`);
                return;
            }
        }
        
        setLoading(true);
        setError('');

        try {
            // Submit tasks sequentially to avoid SQLite database locking
            for (const t of tasks) {
                await stationService.logWork(t.id, {
                    operatorId: employeeId,
                    pinCode: pin,
                    quantity: parseInt(quantity),
                    notes: notes.trim() || null
                });
            }
            
            onSuccess?.(); // Refresh task list
            onClose();
        } catch (err) {
            const message = err.response?.data?.message || 'Gagal submit. Periksa PIN dan coba lagi.';
            setError(message);
            setPin('');
        } finally {
            setLoading(false);
        }
    };

    const cn = (...inputs) => inputs.filter(Boolean).join(' ');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop: Soft glassmorphism */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal Container: Compact V2 */}
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
                
                {/* Header: Compact */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                            <ClipboardList size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tight text-slate-800 dark:text-white uppercase">Log Kerja</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Input pencapaian produksi</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                </header>

                {/* Task Context: Batch or Single */}
                {isBatchMode ? (
                    <div className="bg-primary/5 border-b border-primary/10 px-6 py-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg">
                                {tasks.length}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Mode Batch</p>
                                <p className="text-xs text-slate-500">
                                    {tasks.length} tugas akan dicatat dengan jumlah yang sama
                                </p>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {tasks.slice(0, 5).map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-white rounded-lg text-[10px] font-bold text-slate-600 border border-slate-100">
                                    {t.poDisplay} - {t.productName}
                                </span>
                            ))}
                            {tasks.length > 5 && (
                                <span className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500">
                                    +{tasks.length - 5} lainnya
                                </span>
                            )}
                        </div>
                    </div>
                ) : (
                <div className="bg-slate-50/50 dark:bg-slate-800/30 px-6 py-3 flex flex-wrap gap-4 items-center border-b border-slate-50 dark:border-slate-800 text-xs">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">PO</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200 uppercase">{firstTask.poDisplay}</p>
                    </div>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Produk</p>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{firstTask.productName}</p>
                    </div>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Station</p>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-md border border-primary/20">
                            {firstTask.processName || 'Cutting'}
                        </span>
                    </div>
                    <div className="ml-auto text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target</p>
                        <p className="font-bold text-rose-500">{firstTask.total - firstTask.completed} <span className="text-[9px] opacity-60">pcs</span></p>
                    </div>
                </div>
                )}

                {/* Main Interaction Area */}
                <div className="flex flex-col lg:flex-row flex-1 p-6 gap-6 overflow-y-auto">
                    
                    {/* Left side: Inputs */}
                    <div className="flex-1 flex flex-col gap-5">
                        {/* Operator Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operator</label>
                            <div className="relative group">
                                <select 
                                    value={employeeId}
                                    onChange={(e) => { setEmployeeId(e.target.value); setError(''); }}
                                    className="w-full h-11 pl-4 pr-10 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none appearance-none cursor-pointer transition-all shadow-sm group-hover:border-slate-200"
                                >
                                    <option value="" disabled>Pilih operator...</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} — {emp.employee_id || emp.id}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={16} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Split Inputs: PIN & Total */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* PIN Display */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">PIN</label>
                                <div 
                                    className={cn(
                                        "flex gap-1.5 justify-between p-1.5 rounded-xl border-2 transition-all cursor-pointer",
                                        activeField === 'pin' ? 'border-primary bg-primary/5 ring-2 ring-primary/5' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50'
                                    )}
                                    onClick={() => setActiveField('pin')}
                                >
                                    {[0, 1, 2, 3, 4, 5].map((i) => (
                                        <div 
                                            key={i}
                                            className={cn(
                                                "flex-1 aspect-square max-w-[32px] flex items-center justify-center rounded-lg transition-all",
                                                pin[i] ? 'bg-slate-900 dark:bg-primary scale-100 shadow-md' : 'bg-white dark:bg-slate-700 scale-95 border border-slate-100 dark:border-slate-600'
                                            )}
                                        >
                                            {pin[i] && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quantity Input */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Jumlah</label>
                                <div 
                                    onClick={() => setActiveField('quantity')}
                                    className={cn(
                                        "h-11 px-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all",
                                        activeField === 'quantity' ? 'border-primary bg-primary/5 ring-2 ring-primary/5' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50'
                                    )}
                                >
                                    <span className={cn(
                                        "text-xl font-black tracking-tight",
                                        quantity === '0' ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-white'
                                    )}>{quantity}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase">pcs</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catatan (opsional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Kendala, masalah, atau catatan lainnya..."
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none resize-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Right side: Compact Numpad */}
                    <div className="flex-none w-full lg:w-[180px] select-none">
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleNumpadClick(num)}
                                    className="aspect-square rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/5 active:scale-90 text-lg font-bold text-slate-800 dark:text-white transition-all shadow-sm flex items-center justify-center"
                                >
                                    {num}
                                </button>
                            ))}
                            
                            <button 
                                type="button"
                                onClick={handleClear}
                                className="aspect-square flex items-center justify-center text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                C
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => handleNumpadClick(0)}
                                className="aspect-square rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/5 active:scale-90 text-lg font-bold text-slate-800 dark:text-white transition-all shadow-sm flex items-center justify-center"
                            >
                                0
                            </button>

                            <button 
                                type="button"
                                onClick={handleBackspace}
                                className="aspect-square flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                <Delete size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-6 pb-6 pt-3 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 dark:bg-red-900/10 px-4 py-2.5 rounded-lg border border-red-100 dark:border-red-900/20">
                            <AlertCircle size={14} strokeWidth={3} />
                            {error}
                        </div>
                    )}
                    <button 
                        onClick={handleSubmit}
                        disabled={!employeeId || pin.length !== 6 || quantity === '0' || loading}
                        className={cn(
                            "w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg active:scale-[0.98]",
                            (!employeeId || pin.length !== 6 || quantity === '0' || loading)
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : 'bg-slate-900 dark:bg-primary text-white shadow-slate-200 dark:shadow-primary/30 hover:translate-y-[-1px]'
                        )}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} strokeWidth={3} />
                        ) : (
                            <>
                                <CheckCircle size={16} strokeWidth={3} />
                                Kirim Laporan
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default WorkLogModal;
