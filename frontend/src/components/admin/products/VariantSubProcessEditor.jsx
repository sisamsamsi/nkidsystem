import React, { useState, useEffect } from 'react';
import { Plus, X, GripVertical, Loader2, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import api from '../../../lib/axios';

/**
 * Component to assign sub-processes to a specific product variant
 * @param {Object} variant - The variant object with id, name
 * @param {Function} onUpdate - Callback when sub-processes are updated
 */
const VariantSubProcessEditor = ({ variant, onUpdate }) => {
    const [subProcesses, setSubProcesses] = useState([]);
    const [availableSubProcesses, setAvailableSubProcesses] = useState([]);
    const [assignedSubProcesses, setAssignedSubProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (variant?.id) {
            fetchData();
        }
    }, [variant?.id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allSubProcesses, variantData] = await Promise.all([
                api.get('/sub-processes?is_active=true'),
                api.get(`/product-variants/${variant.id}`)
            ]);
            
            const allSP = allSubProcesses.data.data || allSubProcesses.data || [];
            setAvailableSubProcesses(allSP);
            
            // Get currently assigned sub-processes from variant  
            // Check multiple possible response structures
            const variantObj = variantData.data?.data || variantData.data || {};
            const variantSP = variantObj.sub_processes || variantObj.subProcesses || [];
            
            setAssignedSubProcesses(variantSP.map(sp => ({
                id: sp.id,
                name: sp.name,
                parent_name: sp.parent_process_template?.name || sp.parentProcessTemplate?.name || '',
                sequence_order: sp.pivot?.sequence_order || 1,
                weight: sp.pivot?.weight || 1
            })).sort((a, b) => a.sequence_order - b.sequence_order));
        } catch (err) {
            console.error('Error loading sub-processes:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubProcess = (spId) => {
        const sp = availableSubProcesses.find(s => s.id === parseInt(spId));
        if (!sp || assignedSubProcesses.find(a => a.id === sp.id)) return;
        
        const newItem = {
            id: sp.id,
            name: sp.name,
            parent_name: sp.parent_process_template?.name || '',
            sequence_order: assignedSubProcesses.length + 1,
            weight: 1
        };
        setAssignedSubProcesses([...assignedSubProcesses, newItem]);
    };

    const handleRemoveSubProcess = (spId) => {
        setAssignedSubProcesses(prev => 
            prev.filter(sp => sp.id !== spId)
                .map((sp, idx) => ({ ...sp, sequence_order: idx + 1 }))
        );
    };

    const handleMoveUp = (index) => {
        if (index === 0) return;
        const newList = [...assignedSubProcesses];
        [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
        setAssignedSubProcesses(newList.map((sp, idx) => ({ ...sp, sequence_order: idx + 1 })));
    };

    const handleMoveDown = (index) => {
        if (index === assignedSubProcesses.length - 1) return;
        const newList = [...assignedSubProcesses];
        [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        setAssignedSubProcesses(newList.map((sp, idx) => ({ ...sp, sequence_order: idx + 1 })));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveSuccess(false);
        try {
            await api.post(`/product-variants/${variant.id}/sub-processes`, {
                sub_processes: assignedSubProcesses.map(sp => ({
                    sub_process_id: sp.id,
                    sequence_order: sp.sequence_order,
                    weight: sp.weight
                }))
            });
            setSaveSuccess(true);
            // Refetch to confirm data was saved
            await fetchData();
            if (onUpdate) onUpdate(assignedSubProcesses);
            // Reset success after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Error saving sub-processes:', err);
            alert('Gagal menyimpan sub-proses. Silakan coba lagi.');
        } finally {
            setSaving(false);
        }
    };

    // Get unassigned sub-processes for dropdown
    const unassignedSubProcesses = availableSubProcesses.filter(
        sp => !assignedSubProcesses.find(a => a.id === sp.id)
    );

    // Group by parent process
    const groupedUnassigned = unassignedSubProcesses.reduce((acc, sp) => {
        const parent = sp.parent_process_template?.name || 'Other';
        if (!acc[parent]) acc[parent] = [];
        acc[parent].push(sp);
        return acc;
    }, {});

    if (!variant?.id) return null;

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Layers size={18} className="text-slate-400" />
                    <span className="font-medium text-slate-700">{variant.name}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">
                        {assignedSubProcesses.length} sub-proses
                    </span>
                </div>
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-blue-500" size={24} />
                        </div>
                    ) : (
                        <>
                            {/* Add Sub-Process */}
                            <div className="mb-4">
                                <select
                                    onChange={(e) => {
                                        handleAddSubProcess(e.target.value);
                                        e.target.value = '';
                                    }}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    defaultValue=""
                                >
                                    <option value="" disabled>+ Tambah Sub-Proses...</option>
                                    {Object.entries(groupedUnassigned).map(([parent, sps]) => (
                                        <optgroup key={parent} label={parent}>
                                            {sps.map(sp => (
                                                <option key={sp.id} value={sp.id}>{sp.name}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            {/* Assigned List */}
                            {assignedSubProcesses.length === 0 ? (
                                <div className="text-center py-6 text-slate-400 text-sm">
                                    Belum ada sub-proses yang diassign ke varian ini
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {assignedSubProcesses.map((sp, idx) => (
                                        <div key={sp.id} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                                            <div className="flex flex-col">
                                                <button onClick={() => handleMoveUp(idx)} disabled={idx === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button onClick={() => handleMoveDown(idx)} disabled={idx === assignedSubProcesses.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                            <span className="w-6 h-6 bg-slate-200 text-slate-600 rounded-md flex items-center justify-center text-xs font-bold">
                                                {sp.sequence_order}
                                            </span>
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-slate-700">{sp.name}</span>
                                                <span className="text-xs text-slate-400 ml-2">({sp.parent_name})</span>
                                            </div>
                                            <button onClick={() => handleRemoveSubProcess(sp.id)} className="text-slate-400 hover:text-red-500">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Save Button */}
                            {assignedSubProcesses.length > 0 && (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                                        saveSuccess 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {saving && <Loader2 className="animate-spin" size={16} />}
                                    {saveSuccess ? '✓ Tersimpan!' : 'Simpan Sub-Proses'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default VariantSubProcessEditor;
