import React, { useState, useEffect } from "react";
import {
    Factory,
    RefreshCw,
    CheckCircle2,
    Scissors,
    Shirt,
    Package,
    Lock,
    ShieldAlert,
    Delete,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { stationService } from "../../services/stationService";
import api from "../../lib/axios";

const StationLogin = () => {
    const navigate = useNavigate();
    const [selectedStation, setSelectedStation] = useState(null);
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [stations, setStations] = useState([]);
    const [loadingStations, setLoadingStations] = useState(true);

    // Icon mapping for station types
    const getStationIcon = (name) => {
        const nameLower = name.toLowerCase();
        if (nameLower.includes("cutting") || nameLower.includes("cut")) return Scissors;
        if (nameLower.includes("sewing") || nameLower.includes("sew")) return Shirt;
        if (nameLower.includes("packing") || nameLower.includes("pack")) return Package;
        return RefreshCw;
    };

    // Auto-redirect if already station-authenticated
    useEffect(() => {
        if (stationService.isAuthenticated()) {
            navigate("/station");
        }
    }, [navigate]);

    // Fetch stations from API
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await api.get("/station");
                const stationData = response.data.data || response.data;
                setStations(stationData.map(s => ({
                    ...s,
                    icon: getStationIcon(s.name)
                })));
                if (stationData.length > 0) {
                    setSelectedStation(stationData[0].id);
                }
            } catch (err) {
                // Fallback to mock data if API not available
                const mockStations = [
                    { id: 1, name: "Cutting Line A", code: "104", icon: Scissors },
                    { id: 2, name: "Sewing Line 1", code: "201", icon: Shirt },
                    { id: 3, name: "Finishing A", code: "305", icon: RefreshCw },
                    { id: 4, name: "Packing B", code: "410", icon: Package },
                ];
                setStations(mockStations);
                setSelectedStation(1);
            } finally {
                setLoadingStations(false);
            }
        };
        fetchStations();
    }, []);

    const handleNumpadClick = (num) => {
        if (pin.length < 6) {
            setPin((prev) => prev + num);
        }
    };

    const handleClear = () => {
        setPin("");
    };

    const handleBackspace = () => {
        setPin((prev) => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (!selectedStation || pin.length !== 6) return;
        
        setLoading(true);
        setError("");

        try {
            await stationService.authenticate(selectedStation, pin);
            navigate("/station");
        } catch (err) {
            const message = err.response?.data?.message || "PIN tidak valid. Silakan coba lagi.";
            setError(message);
            setPin("");
        } finally {
            setLoading(false);
        }
    };

    const cn = (...inputs) => inputs.filter(Boolean).join(' ');

    return (
        <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* LEFT PANEL: Branding & Visual Context */}
            <div className="relative hidden lg:flex w-[400px] flex-col justify-between p-12 bg-slate-900 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
                
                <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-2xl">
                            <Factory size={32} strokeWidth={2.5} />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">NKIDS</h2>
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Management System</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-12">
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tighter">
                            Workstation <br /> 
                            <span className="text-primary">Unlock.</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px]">
                            Silakan pilih workstation Anda dan masukkan PIN untuk mulai memantau produksi hari ini.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="h-px w-full bg-white/10" />
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                            System Online
                        </div>
                        <span>v3.0.1 PRO</span>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Main Interaction */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-slate-900">
                <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8 md:p-12 gap-10">
                    
                    {/* STEP 1: Station Selection */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Pilih Workstation</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identifikasi lokasi kerja anda</p>
                            </div>
                            {/* Branch Indicator - Subtle Badge */}
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">NKids North Branch</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {loadingStations ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                    <Loader2 className="animate-spin text-primary" size={28} />
                                    <span className="text-xs font-black uppercase tracking-widest">Loading Workstations...</span>
                                </div>
                            ) : (
                                stations.map((station) => {
                                    const Icon = station.icon;
                                    const isActive = selectedStation === station.id;

                                    return (
                                        <button
                                            key={station.id}
                                            onClick={() => setSelectedStation(station.id)}
                                            className={cn(
                                                "relative group flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all duration-300",
                                                isActive 
                                                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/5 -translate-y-1"
                                                    : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                                isActive 
                                                    ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20"
                                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:scale-105"
                                            )}>
                                                <Icon size={28} strokeWidth={2.5} />
                                            </div>
                                            <div className="text-center space-y-0.5">
                                                <p className={cn(
                                                    "text-xs font-black uppercase tracking-widest",
                                                    isActive ? "text-primary" : "text-slate-600 dark:text-slate-400"
                                                )}>
                                                    {station.name}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-60">ID: {station.code}</p>
                                            </div>

                                            {isActive && (
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white">
                                                    <CheckCircle2 size={12} strokeWidth={4} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

                    {/* STEP 2: Login Core */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-12 items-center lg:items-start animate-in slide-in-from-bottom-8 duration-700">
                        {/* PIN Entry Information */}
                        <div className="w-full lg:w-1/3 flex flex-col items-center lg:items-start gap-4">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400">
                                <Lock size={32} strokeWidth={2.5} />
                            </div>
                            <div className="text-center lg:text-left space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Security Access</h3>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                    Masukkan 6 digit PIN untuk workstation <span className="text-primary font-black uppercase">
                                        {stations.find(s => s.id === selectedStation)?.name || '...'}
                                    </span>
                                </p>
                            </div>

                            {error && (
                                <div className="w-full flex items-center gap-3 text-red-600 text-[11px] font-black uppercase tracking-wider bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-2xl border border-red-100 dark:border-red-900/20">
                                    <AlertCircle size={14} strokeWidth={3} />
                                    {error}
                                </div>
                            )}

                            {/* PIN Dots - Clean Minimalist Style */}
                            <div className="flex items-center gap-4 py-4">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "w-3 h-3 rounded-full transition-all duration-300",
                                            i < pin.length
                                                ? "bg-primary scale-150 shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                                                : "bg-slate-100 dark:bg-slate-800"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Numpad Widget */}
                        <div className="flex-1 w-full max-w-[360px]">
                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handleNumpadClick(num)}
                                        className="aspect-square rounded-[1.75rem] bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/5 active:scale-90 active:bg-primary/10 text-2xl font-black text-slate-800 dark:text-white transition-all shadow-sm flex items-center justify-center"
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handleClear}
                                    className="aspect-square flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <span className="text-lg">C</span>
                                    Clear
                                </button>
                                <button
                                    onClick={() => handleNumpadClick(0)}
                                    className="aspect-square rounded-[1.75rem] bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/5 active:scale-90 active:bg-primary/10 text-2xl font-black text-slate-800 dark:text-white transition-all shadow-sm flex items-center justify-center"
                                >
                                    0
                                </button>
                                <button
                                    onClick={handleBackspace}
                                    className="aspect-square flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                                >
                                    <Delete size={32} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="mt-8 flex flex-col gap-4">
                                <button
                                    onClick={handleLogin}
                                    disabled={pin.length !== 6 || loading}
                                    className="w-full h-16 bg-slate-900 dark:bg-primary text-white font-black text-xs uppercase tracking-[0.2em] rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-primary/20 flex items-center justify-center gap-3 transition-all hover:translate-y-[-2px] active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                    {loading ? "Authenticating..." : "Unlock Access"}
                                </button>
                                
                                <button
                                    onClick={() => navigate("/login")}
                                    className="group flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <ShieldAlert size={16} className="group-hover:animate-bounce" />
                                    Admin Override
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StationLogin;
