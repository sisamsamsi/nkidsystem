import React, { useState, useEffect } from "react";
import {
    X,
    CheckCircle2,
    XCircle,
    Droplets,
    Scissors,
    Activity,
    AlertTriangle,
    Ruler,
    Plus,
    Delete,
    Save,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { qcService } from "../../services/qcService";

const QCLogModal = ({ isOpen, onClose, task, onSuccess }) => {
    const [goodQty, setGoodQty] = useState(0);
    const [rejectQty, setRejectQty] = useState(0);
    const [activeField, setActiveField] = useState("good"); // 'good' | 'reject'
    const [rejectReason, setRejectReason] = useState("");
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Reset state when task changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setGoodQty(0);
            setRejectQty(0);
            setRejectReason("");
            setNotes('');
            setActiveField("good");
            setError("");
        }
    }, [isOpen, task]);

    if (!isOpen) return null;

    const handleNumpadClick = (num) => {
        if (activeField === "good") {
            setGoodQty((prev) => parseInt(prev.toString() + num));
        } else {
            setRejectQty((prev) => parseInt(prev.toString() + num));
        }
    };

    const handleBackspace = () => {
        if (activeField === "good") {
            setGoodQty((prev) => Math.floor(prev / 10));
        } else {
            setRejectQty((prev) => Math.floor(prev / 10));
        }
    };

    const handleClear = () => {
        if (activeField === "good") {
            setGoodQty(0);
        } else {
            setRejectQty(0);
        }
    };

    const cn = (...inputs) => inputs.filter(Boolean).join(' ');

    const handleSubmit = async () => {
        if (goodQty === 0 && rejectQty === 0) return;

        // Target quantity validation
        const remainingQty = task ? (task.total - task.completed) : 0;
        if (goodQty + rejectQty > remainingQty) {
            setError(`Total kuantitas (Good + Reject) tidak boleh melebihi sisa target (${remainingQty} pcs)`);
            return;
        }

        if (rejectQty > 0 && !rejectReason) {
            setError('Silakan pilih alasan reject.');
            return;
        }

        setLoading(true);
        setError("");

        try {
            await qcService.submitReport({
                taskId: task?.id,
                passedQuantity: goodQty,
                rejectQuantity: rejectQty,
                rejectReason: rejectQty > 0 ? rejectReason : null,
                notes: notes.trim() || null
            });
            
            onSuccess?.();
            onClose();
        } catch (err) {
            const message = err.response?.data?.message || "Gagal submit QC report. Coba lagi.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop: Soft glassmorphism */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal Container: Compact V2 */}
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800">
                
                {/* Header Section: Compact */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <Activity size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tight text-slate-800 dark:text-white uppercase">QC Inspection</h1>
                            <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                    {task?.poDisplay || "PO #--"}
                                </span>
                                <span>•</span>
                                <span>{task?.productName || "Product Name"}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                </header>

                {/* Modal Content: Split View */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* Left Column: Inputs & Defects */}
                    <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-900 lg:border-r border-slate-50 dark:border-slate-800 p-6">
                        <div className="flex flex-col gap-6">
                            {/* Quantity Inputs Group */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Good Quantity Input */}
                                <div
                                    onClick={() => setActiveField("good")}
                                    className="group space-y-2 cursor-pointer"
                                >
                                    <label className={cn(
                                        "text-[10px] font-black uppercase tracking-widest pl-1 transition-colors",
                                        activeField === "good" ? "text-emerald-500" : "text-slate-500"
                                    )}>Good Quality</label>
                                    <div
                                        className={cn(
                                            "relative h-16 w-full rounded-xl flex items-center justify-between px-5 transition-all border-2",
                                            activeField === "good"
                                                ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-500 ring-4 ring-emerald-500/5"
                                                : "bg-slate-50/50 dark:bg-slate-800/50 border-transparent hover:border-emerald-200"
                                        )}
                                    >
                                        <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">
                                            {goodQty}
                                        </span>
                                        <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-900 text-emerald-600 flex items-center justify-center">
                                            <CheckCircle2 size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>

                                {/* Reject Quantity Input */}
                                <div
                                    onClick={() => setActiveField("reject")}
                                    className="group space-y-2 cursor-pointer"
                                >
                                    <label className={cn(
                                        "text-[10px] font-black uppercase tracking-widest pl-1 transition-colors",
                                        activeField === "reject" ? "text-rose-500" : "text-slate-500"
                                    )}>Reject Qty</label>
                                    <div
                                        className={cn(
                                            "relative h-16 w-full rounded-xl flex items-center justify-between px-5 transition-all border-2",
                                            activeField === "reject"
                                                ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-500 ring-4 ring-rose-500/5"
                                                : "bg-slate-50/50 dark:bg-slate-800/50 border-transparent hover:border-rose-200"
                                        )}
                                    >
                                        <span className="text-3xl font-black text-rose-700 dark:text-rose-400 tracking-tighter">
                                            {rejectQty}
                                        </span>
                                        <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 flex items-center justify-center">
                                            <XCircle size={18} strokeWidth={3} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reject Reason Selection - Only show if rejectQty > 0 */}
                            {rejectQty > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Alasan Reject</label>
                                    <div className="relative">
                                        <select
                                            value={rejectReason}
                                            onChange={(e) => { setRejectReason(e.target.value); setError(''); }}
                                            className="w-full h-11 pl-4 pr-10 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none appearance-none cursor-pointer transition-all shadow-sm"
                                        >
                                            <option value="" disabled>Pilih alasan reject...</option>
                                            <option value="Jahitan Rusak">Jahitan Rusak / Broken Stitches</option>
                                            <option value="Noda Kain">Noda Kain / Stain</option>
                                            <option value="Kain Robek">Kain Robek / Fabric Tear</option>
                                            <option value="Ukuran Tidak Sesuai">Ukuran Tidak Sesuai / Measurement Error</option>
                                            <option value="Warna Belang">Warna Belang / Shading</option>
                                            <option value="Lainnya">Lainnya (Tulis di Catatan)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes Section */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Catatan / Detail Tambahan (opsional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: kain habis, sobek, ukuran tidak sesuai..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none resize-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Compact Numpad */}
                    <div className="w-full lg:w-[200px] bg-slate-50/50 dark:bg-slate-800/50 border-t lg:border-t-0 flex flex-col shrink-0 p-4">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumpadClick(num)}
                                        className="aspect-square rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/5 active:scale-90 text-lg font-bold text-slate-800 dark:text-white transition-all shadow-sm flex items-center justify-center"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handleBackspace}
                                    className="aspect-square flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    <Delete size={18} strokeWidth={2.5} />
                                </button>
                                <button
                                    onClick={() => handleNumpadClick(0)}
                                    className="aspect-square rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/5 active:scale-90 text-lg font-bold text-slate-800 dark:text-white transition-all shadow-sm flex items-center justify-center"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="aspect-square flex items-center justify-center text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
                                >
                                    C
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar: Compact */}
                <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-4 shrink-0">
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold uppercase tracking-widest bg-red-50 dark:bg-red-900/10 px-4 py-2.5 rounded-lg border border-red-100">
                            <AlertCircle size={14} strokeWidth={3} />
                            {error}
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={(goodQty === 0 && rejectQty === 0) || loading}
                            className={cn(
                                "px-8 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2",
                                (goodQty === 0 && rejectQty === 0) || loading
                                    ? "bg-slate-100 text-slate-400 shadow-none"
                                    : "bg-slate-900 dark:bg-primary text-white shadow-slate-200 dark:shadow-primary/30 hover:translate-y-[-1px]"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} strokeWidth={3} />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Save size={14} strokeWidth={3} />
                                    Simpan QC
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QCLogModal;
