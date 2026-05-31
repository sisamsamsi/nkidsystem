import React, { useState, useEffect, useCallback } from "react";
import {
    Check, Plus, Package, Palette, X, Trash2, PlusCircle,
    ChevronRight, ChevronLeft, Loader2, AlertCircle, 
    Shirt, Box, Settings, ListChecks, ArrowRight,
    Search, User, FileText, Info
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { parseColorInput } from "../../../lib/colors";
import { SIZES } from "../../../lib/constants";
import {
    productService,
    productVariantService,
} from "../../../services/productService";
import { customerService } from "../../../services/customerService";
import api from '../../../lib/axios';
import VariantSubProcessEditor from '../../../components/admin/products/VariantSubProcessEditor';

const ProductBuilder = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    // --- State ---
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [customers, setCustomers] = useState([]);
    const [availableTemplates, setAvailableTemplates] = useState([]);
    
    const [formData, setFormData] = useState({
        basicInfo: {
            name: "",
            customer_id: "",
            style_code: "",
            description: "",
        },
        variants: [],
    });

    // Step 2 State (Variants Input)
    const [newVariant, setNewVariant] = useState({
        name: "",
        colors: "",
        sizes: SIZES, // Default to all sizes for convenience
        image_url: "",
    });

    // --- Data Fetching ---
    useEffect(() => {
        const initData = async () => {
            try {
                const [custRes, templateRes] = await Promise.all([
                    customerService.getAll(),
                    productService.getProcessTemplates()
                ]);
                
                const custData = custRes.data || custRes;
                setCustomers(Array.isArray(custData) ? custData : custData.data || []);
                setAvailableTemplates(templateRes.data || []);
            } catch (err) {
                console.error("Initialization failed", err);
            }
        };
        initData();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            const fetchProduct = async () => {
                setLoading(true);
                try {
                    const response = await productService.getById(id);
                    const product = response.data || response;
                    setFormData({
                        basicInfo: {
                            name: product.name || "",
                            customer_id: product.customer_id || "",
                            style_code: product.style_code || "",
                            description: product.description || "",
                        },
                        variants: (product.variants || []).map((v) => ({
                            ...v,
                            id: v.id,
                            name: v.name,
                            colors: parseColorInput(v.colors),
                            sizes: typeof v.sizes === "string" 
                                ? v.sizes.split(",").map(s => s.trim()).filter(Boolean)
                                : v.sizes || [],
                            processes: (v.processes || []).map(p => ({
                                process_template_id: p.process_template_id,
                                weight: p.weight || 1,
                                sequence_order: p.sequence_order || 1
                            }))
                        })),
                    });
                } catch (err) {
                    setError("Failed to load product data");
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        }
    }, [id, isEditMode]);

    // --- Style Code Generation ---
    const generateStyleCode = async (name) => {
        if (!name || isEditMode) return; // Don't auto-gen if editing existing
        try {
            const response = await api.get(`/products/generate-style-code?name=${encodeURIComponent(name)}`);
            if (response.data.success) {
                setFormData(prev => ({
                    ...prev,
                    basicInfo: { ...prev.basicInfo, style_code: response.data.style_code }
                }));
            }
        } catch (err) {
            console.error("Style code generation failed", err);
        }
    };

    // --- Handlers ---
    const handleNameChange = (e) => {
        const newName = e.target.value;
        setFormData(prev => ({
            ...prev,
            basicInfo: { ...prev.basicInfo, name: newName }
        }));
        // Debounce or just call for now
        if (newName.length >= 3) {
            generateStyleCode(newName);
        }
    };

    const handleBasicInfoChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            basicInfo: { ...prev.basicInfo, [field]: value },
        }));
    };

    const handleAddVariant = () => {
        if (!newVariant.name) return;
        const variant = {
            id: `temp-${Date.now()}`,
            name: newVariant.name,
            colors: parseColorInput(newVariant.colors),
            sizes: newVariant.sizes,
            image_url: newVariant.image_url || null,
            processes: []
        };
        setFormData(prev => ({ ...prev, variants: [...prev.variants, variant] }));
        setNewVariant({ name: "", colors: "", sizes: SIZES, image_url: "" });
    };

    const toggleSize = (size) => {
        setNewVariant(prev => {
            const sizes = prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size];
            return { ...prev, sizes };
        });
    };

    const toggleVariantProcess = (variantId, templateId) => {
        setFormData((prev) => ({
            ...prev,
            variants: prev.variants.map((v) => {
                if (v.id !== variantId) return v;
                const processes = v.processes || [];
                const idx = processes.findIndex(p => p.process_template_id == templateId);

                if (idx !== -1) {
                    return {
                        ...v,
                        processes: processes.filter((_, i) => i !== idx)
                    };
                } else {
                    const template = availableTemplates.find(t => t.id == templateId);
                    return {
                        ...v,
                        processes: [
                            ...processes,
                            {
                                process_template_id: templateId,
                                weight: template?.default_weight || 1,
                                sequence_order: processes.length + 1,
                            },
                        ],
                    };
                }
            }),
        }));
    };

    const handleSaveProduct = async () => {
        const { name, customer_id } = formData.basicInfo;
        if (!name || !customer_id || formData.variants.length === 0) {
            setError("Please complete all basic info and add at least one variant.");
            setCurrentStep(1);
            return;
        }

        setSaving(true);
        setError("");
        try {
            const productData = {
                ...formData.basicInfo,
                variants: formData.variants.map((v) => ({
                    id: String(v.id).startsWith("temp-") ? undefined : v.id,
                    name: v.name,
                    colors: v.colors.map((c) => c.name).join(", "),
                    sizes: v.sizes.join(", "),
                    image_url: v.image_url || null,
                    processes: v.processes || []
                })),
            };

            if (isEditMode) {
                await productService.update(id, productData);
            } else {
                await productService.create(productData);
            }
            navigate("/admin/products");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    // --- UI Components ---
    const StepIndicator = () => {
        const steps = [
            { id: 1, label: "Basic Info", icon: Info, color: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
            { id: 2, label: "Variants", icon: Shirt, color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
            { id: 3, label: "Flow & Path", icon: Settings, color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
            { id: 4, label: "Final Review", icon: ListChecks, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' }
        ];

        return (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between mb-8 overflow-hidden">
                {steps.map((step, idx) => (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-2 flex-1 relative group cursor-pointer" onClick={() => step.id < currentStep && setCurrentStep(step.id)}>
                            <div className={`size-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                                currentStep === step.id ? `${step.color} border-transparent text-white shadow-xl ${step.color}/30 scale-110` :
                                currentStep > step.id ? `${step.bg} ${step.border} ${step.text}` : 
                                'bg-slate-50 border-slate-100 text-slate-400'
                            }`}>
                                {currentStep > step.id ? <Check size={20} strokeWidth={3} /> : <step.icon size={22} />}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep === step.id ? step.text : 'text-slate-400'}`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < 3 && (
                            <div className="h-1 flex-1 mx-2 rounded-full overflow-hidden bg-slate-100">
                                <div className={`h-full transition-all duration-700 ${currentStep > step.id ? steps[idx].color : 'w-0'}`} style={{ width: currentStep > step.id ? '100%' : '0%' }}></div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    if (loading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={48} /></div>;

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-light text-slate-800 tracking-tight">
                        {isEditMode ? 'Edit Product' : 'Product Builder'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-light">
                        {isEditMode ? 'Modify existing product specifications' : 'Create a new garment masterpiece step-by-step'}
                    </p>
                </div>
            </header>

            <StepIndicator />

            {error && (
                <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
                <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 space-y-8">
                        <div className="flex items-center gap-3 text-slate-800 font-bold mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Package size={18} /></div>
                            General Information
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Product Name *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.basicInfo.name}
                                    onChange={handleNameChange}
                                    placeholder="e.g. NUSA - Summer Edition"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Assign to Customer *</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <select 
                                        value={formData.basicInfo.customer_id}
                                        onChange={(e) => handleBasicInfoChange("customer_id", e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={18} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Style Code (Auto-Gen)</label>
                                <div className="relative">
                                    <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input 
                                        type="text" 
                                        value={formData.basicInfo.style_code}
                                        onChange={(e) => handleBasicInfoChange("style_code", e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-sm font-bold text-indigo-600 transition-all font-mono"
                                        placeholder="STYLE-001"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Product Description</label>
                                <textarea 
                                    rows="4"
                                    value={formData.basicInfo.description}
                                    onChange={(e) => handleBasicInfoChange("description", e.target.value)}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none"
                                    placeholder="Add notes about fabric, fit, or design details..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            onClick={() => setCurrentStep(2)}
                            className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-3 active:scale-95"
                        >
                            Configure Variants
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Variants */}
            {currentStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
                    {/* Left: Form */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                            <div className="p-6 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 flex items-center gap-2">
                                <PlusCircle className="text-primary" size={20} />
                                Add New Variant
                            </div>
                            <div className="p-8 space-y-8 text-left">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Variant Name</label>
                                    <input 
                                        type="text" 
                                        value={newVariant.name}
                                        onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="e.g. Batch A"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex justify-between">
                                        Color Scheme (Comma-separated)
                                        <Palette size={14} className="text-slate-300" />
                                    </label>
                                    <input 
                                        type="text" 
                                        value={newVariant.colors}
                                        onChange={(e) => setNewVariant({...newVariant, colors: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="e.g. Navy, Cream, #ff0000"
                                    />
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {parseColorInput(newVariant.colors).map((c, i) => (
                                            <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-bold shadow-sm">
                                                <div className="w-3 h-3 rounded-full border border-black/5" style={{backgroundColor: c.hex}}></div>
                                                {c.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sizes Available</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {SIZES.map(s => (
                                            <button 
                                                key={s}
                                                onClick={() => toggleSize(s)}
                                                className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                                                    newVariant.sizes.includes(s) 
                                                    ? 'bg-indigo-50 border-primary text-primary' 
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Image URL (Optional)</label>
                                    <input 
                                        type="text" 
                                        value={newVariant.image_url}
                                        onChange={(e) => setNewVariant({...newVariant, image_url: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary/5"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {newVariant.image_url && (
                                        <div className="mt-3">
                                            <img 
                                                src={newVariant.image_url} 
                                                alt="Preview" 
                                                className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleAddVariant}
                                    className="w-full bg-slate-800 hover:bg-black text-white py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    Add this Variant
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl min-h-[500px] overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center px-8">
                                <h3 className="font-bold text-slate-800">Added Variants ({formData.variants.length})</h3>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Drag to reorder functionality coming soon</div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50">
                                            <th className="py-4 px-8">Variant / Design</th>
                                            <th className="py-4 px-4 text-center">Colors</th>
                                            <th className="py-4 px-4">Size Range</th>
                                            <th className="py-4 px-8 text-right">Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {formData.variants.map((v) => (
                                            <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-8">
                                                    <div className="font-bold text-slate-700">{v.name}</div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex justify-center -space-x-1.5">
                                                        {v.colors.map((c, i) => (
                                                            <div key={i} className="w-7 h-7 rounded-full ring-2 ring-white border border-black/5 shadow-sm" style={{backgroundColor: c.hex}} title={c.name}></div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {v.sizes.map(s => <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded border border-slate-200">{s}</span>)}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-8 text-right">
                                                    <button 
                                                        onClick={() => setFormData({...formData, variants: formData.variants.filter(item => item.id !== v.id)})}
                                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {formData.variants.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="py-24 text-center">
                                                    <Box size={48} className="text-slate-100 mx-auto mb-4" />
                                                    <p className="text-sm font-medium text-slate-400">No variants added yet</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setCurrentStep(1)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3">
                                <ChevronLeft size={20} /> Previous
                            </button>
                            <button onClick={() => setCurrentStep(3)} className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-3">
                                Production Flow <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Production Flow */}
            {currentStep === 3 && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
                        <h3 className="text-xl font-bold mb-2">Configure Workflow</h3>
                        <p className="text-slate-400 text-sm max-w-2xl">Define the journey of each variant. Once configured, workers at each station can start processing these items according to the path you set.</p>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 text-left">
                        {formData.variants.map((v) => (
                            <div key={v.id} className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden flex flex-col">
                                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center px-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary font-bold"><Shirt size={18} /></div>
                                        <div className="font-bold text-slate-800">{v.name}</div>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {v.colors.map((c, i) => (
                                            <div key={i} className="w-4 h-4 rounded-full border border-black/5" style={{backgroundColor: c.hex}}></div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableTemplates.map(t => {
                                        const isSelected = v.processes?.find(p => p.process_template_id == t.id);
                                        return (
                                            <button 
                                                key={t.id}
                                                onClick={() => toggleVariantProcess(v.id, t.id)}
                                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                                                    isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                                        {isSelected ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                                                    </div>
                                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-slate-500'}`}>{t.name}</span>
                                                </div>
                                                {isSelected && <div className="text-[10px] font-bold text-slate-400">Step {v.processes.findIndex(p => p.process_template_id == t.id) + 1}</div>}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                {/* Sub-Process Assignment (only for saved variants) */}
                                {isEditMode && v.id && !isNaN(Number(v.id)) ? (
                                    <div className="px-8 pb-6">
                                        <div className="border-t border-slate-100 pt-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Assign Sub-Proses (SEWING / FINISHING)</p>
                                            <VariantSubProcessEditor variant={v} />
                                        </div>
                                    </div>
                                ) : String(v.id).startsWith('temp-') && (
                                    <div className="px-8 pb-6">
                                        <div className="border-t border-slate-100 pt-4 text-center">
                                            <p className="text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg inline-block">
                                                ⚠️ Simpan produk terlebih dahulu untuk assign sub-proses ke varian ini
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between pt-4">
                        <button onClick={() => setCurrentStep(2)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3">
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <button onClick={() => setCurrentStep(4)} className="bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-3">
                            Review & Create <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
                <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        {/* Summary */}
                        <div className="md:col-span-4 space-y-6 text-left">
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8 sticky top-24">
                                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Package className="text-primary" />
                                    Final Summary
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Product Name</div>
                                        <div className="font-bold text-slate-700 text-lg leading-tight">{formData.basicInfo.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Style Code</div>
                                        <div className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">{formData.basicInfo.style_code || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand/Customer</div>
                                        <div className="font-bold text-slate-700">{customers.find(c => c.id == formData.basicInfo.customer_id)?.name || 'N/A'}</div>
                                    </div>
                                    <div className="pt-6 border-t border-slate-50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-slate-400">Total Variants</span>
                                            <span className="text-sm font-bold text-slate-700">{formData.variants.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Variant List */}
                        <div className="md:col-span-8 space-y-4 text-left">
                            {formData.variants.map((v, i) => (
                                <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-bold">{i + 1}</div>
                                            <div>
                                                <div className="font-bold text-slate-800">{v.name}</div>
                                                <div className="flex gap-2.5 mt-1">
                                                    {v.colors.map((c, idx) => (
                                                        <div key={idx} className="flex items-center gap-1">
                                                            <div className="w-3 h-3 rounded-full border border-black/5 shadow-sm" style={{backgroundColor: c.hex}}></div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{c.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                            {v.sizes.map(s => <span key={s} className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold rounded border border-slate-100">{s}</span>)}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 overflow-x-auto py-2">
                                        {(v.processes || []).sort((a,b) => a.sequence_order - b.sequence_order).map((p, idx) => (
                                            <React.Fragment key={idx}>
                                                <div className="flex flex-col items-center gap-1 shrink-0">
                                                    <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 whitespace-nowrap">
                                                        {availableTemplates.find(t => t.id == p.process_template_id)?.name}
                                                    </div>
                                                </div>
                                                {idx < (v.processes.length - 1) && <ChevronRight size={14} className="text-slate-300 shrink-0" />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between pt-8">
                        <button onClick={() => setCurrentStep(3)} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3">
                            <ChevronLeft size={20} /> Previous
                        </button>
                        <button 
                            onClick={handleSaveProduct}
                            disabled={saving}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-12 py-4 rounded-3xl font-black transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-4 border-b-4 border-emerald-700"
                        >
                            {saving ? <Loader2 className="animate-spin" size={24} /> : <Check size={24} strokeWidth={4} />}
                            {isEditMode ? 'Update Product Details' : 'Confirm & Save Product'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Help with ChevronDown missing import if not careful, often lucide icons can be forgotten
const ChevronDown = ({ size = 20, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);

export default ProductBuilder;
