import React from 'react';
import { Search, Bell, ChevronDown, Check, Factory } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const AdminHeader = () => {
    const navigate = useNavigate();
    const user = authService.getStoredUser();
    const userName = user?.name || 'Jane Admin';
    const userRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Production Mgr';

    return (
        <header className="h-16 bg-white border-b border-[#f0f2f5] flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <Check size={20} strokeWidth={3} />
                </div>
                <h1 className="text-[#111418] text-lg font-bold tracking-tight">NKids Production</h1>
            </div>

            <div className="flex items-center gap-6">
                {/* Switch to Station Button */}
                <button 
                    onClick={() => navigate('/station')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-all border border-slate-200 group"
                >
                    <Factory size={18} className="text-slate-400 group-hover:text-blue-600" />
                    <span className="text-sm font-semibold">Switch to Station</span>
                </button>

                {/* Search */}
                <div className="hidden md:flex items-center bg-[#f0f2f5] rounded-lg px-3 py-2 w-64">
                    <Search className="text-[#60708a]" size={20} />
                    <input
                        className="bg-transparent border-none text-sm text-[#111418] placeholder-[#60708a] focus:ring-0 w-full ml-2 p-0 outline-none"
                        placeholder="Search orders..."
                        type="text"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <button className="relative text-[#60708a] hover:text-[#111418] transition-colors">
                        <Bell size={24} />
                        <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    <button className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                        <div className="flex items-center justify-center rounded-full size-8 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900/40 text-sm select-none">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-sm font-medium text-[#111418] leading-none">{userName}</p>
                            <p className="text-xs text-[#60708a] mt-0.5">{userRole}</p>
                        </div>
                        <ChevronDown className="text-[#60708a]" size={20} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
