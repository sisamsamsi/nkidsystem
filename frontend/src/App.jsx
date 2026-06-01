import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import authService from './services/authService';
import stationService from './services/stationService';

// Lazy loaded page components (F1)
const Login = lazy(() => import('./pages/auth/Login'));
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const CustomerList = lazy(() => import('./pages/admin/customers/CustomerList'));
const ProductList = lazy(() => import('./pages/admin/products/ProductList'));
const ProductBuilder = lazy(() => import('./pages/admin/products/ProductBuilder'));
const OrderList = lazy(() => import('./pages/admin/orders/OrderList'));
const OrderWizard = lazy(() => import('./pages/admin/orders/OrderWizard'));
const WorkOrderPrint = lazy(() => import('./pages/admin/orders/WorkOrderPrint'));
const ProductionBoard = lazy(() => import('./pages/admin/production/ProductionBoard'));
const EmployeePerformanceReport = lazy(() => import('./pages/admin/reports/EmployeePerformanceReport'));
const EmployeeList = lazy(() => import('./pages/admin/employees/EmployeeList'));
const SubProcessList = lazy(() => import('./pages/admin/settings/SubProcessList'));
const StationDashboard = lazy(() => import('./pages/station/StationDashboard'));
const StationLogin = lazy(() => import('./pages/station/StationLogin'));
const CustomerOrderTracking = lazy(() => import('./pages/customer/CustomerOrderTracking'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const PrivateRoute = ({ allowedRoles = ['admin'] }) => {
    const user = authService.getStoredUser();
    if (!authService.isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    
    return <Outlet />;
};

const StationPrivateRoute = () => {
    return stationService.isAuthenticated() ? <Outlet /> : <Navigate to="/station/login" replace />;
};

// Placeholder components for other pages
const NotFound = () => <div className="p-8 text-center text-red-500">404 - Page Not Found</div>;

function App() {
    return (
        <div className="min-h-screen bg-background font-sans text-primary">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#f8fafc]">
                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading NKids System...</p>
                </div>
            }>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    
                    {/* Customer Routes */}
                    <Route path="/tracking" element={<CustomerOrderTracking />} />
                    
                    {/* Station Routes (Kiosk Mode) */}
                    <Route path="/station/login" element={<StationLogin />} />
                    <Route element={<StationPrivateRoute />}>
                        <Route path="/station" element={<StationDashboard />} />
                    </Route>

                    {/* Standalone Print Pages (No Layout) - Protected */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/print/work-order/:id" element={<WorkOrderPrint />} />
                    </Route>

                    {/* Admin Routes (Protected) */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="customers" element={<CustomerList />} />
                            <Route path="employees" element={<EmployeeList />} />
                            <Route path="products" element={<ProductList />} />
                            <Route path="products/new" element={<ProductBuilder />} />
                            <Route path="products/:id" element={<ProductBuilder />} />
                            <Route path="orders" element={<OrderList />} />
                            <Route path="orders/new" element={<OrderWizard />} />
                            <Route path="orders/:id" element={<OrderWizard />} />
                            <Route path="production" element={<ProductionBoard />} />
                            <Route path="reports" element={<EmployeePerformanceReport />} />
                            <Route path="settings/sub-processes" element={<SubProcessList />} />
                        </Route>
                    </Route>

                    {/* Redirects / Landing */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </div>
    );
}

export default App;
