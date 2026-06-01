import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingCart, Factory, BarChart, LifeBuoy, Package, Layers, Building2 } from 'lucide-react';

// Grouped Navigation Items
const NAV_GROUPS = [
    {
        title: 'Overview',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        ]
    },
    {
        title: 'Management',
        items: [
            { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
            { icon: Building2, label: 'Customers', path: '/admin/customers' },
            { icon: Package, label: 'Products', path: '/admin/products' },
            { icon: Users, label: 'Employees', path: '/admin/employees' },
        ]
    },
    {
        title: 'Production',
        items: [
            { icon: Factory, label: 'Production Board', path: '/admin/production' },
            { icon: BarChart, label: 'Reports', path: '/admin/reports' },
        ]
    }
];

const AdminSidebar = () => {
    return (
        <aside className="w-[240px] bg-white flex flex-col flex-shrink-0 overflow-y-auto hidden md:flex h-full py-5 px-3 gap-6">
            {/* Logo Area (Optional, uses text for now) */}
            <div className="px-2 mb-1">
                <span className="text-xl font-bold text-[#111418]">NKids <span className="text-primary">Production</span></span>
            </div>

            <nav className="flex flex-col gap-4">
                {NAV_GROUPS.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                        <p className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group.title}</p>
                        <div className="flex flex-col gap-0.5">
                            {group.items.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group ${isActive
                                                ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100 font-bold'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <IconComponent size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                                                    <span className="text-sm">{item.label}</span>
                                                </div>
                                                {isActive && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Settings Section */}
                <div className="flex flex-col gap-2">
                    <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-widest">System</p>
                    <NavLink
                        to="/admin/settings/sub-processes"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-primary text-white shadow-md shadow-primary/20 font-medium'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`
                        }
                    >
                        <Layers size={18} strokeWidth={1.5} />
                        <span className="text-sm">Sub-Processes</span>
                    </NavLink>
                </div>
            </nav>

            <div className="mt-auto">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <LifeBuoy size={18} className="text-primary" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Need Help?</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">Contact support for any production issues.</p>
                    <button 
                        onClick={() => window.location.href = 'mailto:support@nkids.com'}
                        className="w-full bg-white text-gray-900 text-xs font-semibold py-2.5 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AdminSidebar;
