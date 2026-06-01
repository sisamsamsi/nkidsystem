import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Factory, Package, ArrowRight, Search, HelpCircle } from 'lucide-react';

const Card = ({ href, Icon, title, description, cta, theme = 'blue' }) => {
  const themeColors = {
    blue: {
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      iconText: 'text-blue-600 dark:text-blue-400',
      ctaText: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] hover:border-blue-500/30',
      hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400'
    },
    green: {
      iconBg: 'bg-green-50 dark:bg-green-900/30',
      iconText: 'text-green-600 dark:text-green-400',
      ctaText: 'text-green-600 dark:text-green-400',
      hover: 'hover:shadow-[0_20px_40px_rgba(34,197,94,0.15)] hover:border-green-500/30',
      hoverText: 'group-hover:text-green-600 dark:group-hover:text-green-400'
    },
    purple: {
      iconBg: 'bg-purple-50 dark:bg-purple-900/30',
      iconText: 'text-purple-600 dark:text-purple-400',
      ctaText: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:shadow-[0_20px_40px_rgba(147,51,234,0.15)] hover:border-purple-500/30',
      hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
    }
  };

  const colors = themeColors[theme] || themeColors.blue;

  return (
    <Link to={href} className={`group glass-card rounded-2xl p-6 flex flex-col justify-between h-full min-h-64 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none ${colors.hover} transition-all-custom hover:-translate-y-1 relative overflow-hidden`}>
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{backgroundColor: theme === 'blue' ? 'rgba(37,99,235,0.2)' : theme === 'green' ? 'rgba(34,197,94,0.2)' : 'rgba(147,51,234,0.2)'}}></div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl ${colors.iconBg} ${colors.iconText} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          <Icon size={24} />
        </div>
        <h3 className={`text-xl font-bold text-slate-800 dark:text-white mb-2 ${colors.hoverText} transition-colors`}>{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
      <div className={`relative z-10 mt-6 flex items-center ${colors.ctaText} font-semibold group-hover:gap-2 transition-all`}>
        <span className="text-sm">{cta}</span>
        <ArrowRight size={12} className="ml-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
    </Link>
  );
};

const CustomerTrackingCard = () => {
  const navigate = useNavigate();
  const [poNumber, setPoNumber] = useState('');

  const handleTrack = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (poNumber.trim()) {
      navigate(`/tracking?po=${encodeURIComponent(poNumber.trim())}`);
    } else {
      navigate('/tracking');
    }
  };

  return (
    <div 
      onClick={() => document.getElementById('po-input')?.focus()}
      className="group glass-card rounded-2xl p-6 flex flex-col justify-between h-full min-h-64 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_20px_40px_rgba(147,51,234,0.15)] hover:border-purple-500/30 transition-all-custom hover:-translate-y-1 relative overflow-hidden cursor-pointer"
    >
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl bg-purple-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Package size={24} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Customer Tracking</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">Track production status directly via your Purchase Order (PO) number.</p>
        
        {/* PO Search Bar */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 shadow-sm group-hover:shadow-md transition-shadow"
        >
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            id="po-input"
            type="text"
            placeholder="Enter PO Number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTrack(e);
              }
            }}
            className="bg-transparent ml-2 text-xs placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white outline-none flex-1 w-full"
          />
        </div>
      </div>
      <div 
        onClick={handleTrack}
        className="relative z-10 mt-4 flex items-center text-purple-600 dark:text-purple-400 font-semibold group-hover:gap-2 transition-all cursor-pointer"
      >
        <span className="text-sm">Track Order</span>
        <ArrowRight size={12} className="ml-1.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </div>
    </div>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-white font-display flex flex-col items-center justify-center py-8 px-4">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 bg-grid-pattern pointer-events-none opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-5xl">
        {/* Header */}
        <header className="text-center mb-10 md:mb-12">
          <div className="flex items-center justify-center gap-1 mb-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none select-none">
              <span className="text-red-500">N</span><span className="text-blue-600">K</span><span className="text-green-500">i</span><span className="text-yellow-500">d</span><span className="text-indigo-600">s</span>
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-bold tracking-[0.2em] uppercase">Integrated Production Ecosystem</p>
        </header>

        {/* Cards Grid */}
        <main className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 w-full mb-10">
          <Card
            href="/login"
            Icon={LayoutDashboard}
            title="Management & Analytics"
            description="Real-time oversight of orders, inventory, and production metrics."
            cta="Access Admin Portal"
            theme="blue"
          />

          <Card
            href="/station/login"
            Icon={Factory}
            title="Production Station"
            description="Operator interface for QC checks, efficiency tracking, and logging."
            cta="Launch Workstation"
            theme="green"
          />

          <CustomerTrackingCard />
        </main>

        {/* Footer */}
        <footer className="text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <a 
              className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1" 
              href="mailto:support@nkids.com"
            >
              <HelpCircle size={14} />
              Support Center
            </a>
            <span className="hidden md:block w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
            <button 
              onClick={() => alert("🛰️ System Status: All systems fully operational. Latency 14ms.")}
              className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              <span className="text-[14px]">🛰️</span>
              System Status
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-600">© {new Date().getFullYear()} NKids Integrated Systems. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
