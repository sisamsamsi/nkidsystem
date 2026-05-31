import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';

import CustomerList from './pages/admin/customers/CustomerList';
import ProductList from './pages/admin/products/ProductList';
import ProductBuilder from './pages/admin/products/ProductBuilder';
import OrderList from './pages/admin/orders/OrderList';
import OrderWizard from './pages/admin/orders/OrderWizard';
import WorkOrderPrint from './pages/admin/orders/WorkOrderPrint';
import ProductionBoard from './pages/admin/production/ProductionBoard';
import EmployeePerformanceReport from './pages/admin/reports/EmployeePerformanceReport';
import EmployeeList from './pages/admin/employees/EmployeeList';
import SubProcessList from './pages/admin/settings/SubProcessList';
import StationDashboard from './pages/station/StationDashboard';
import StationLogin from './pages/station/StationLogin';
import CustomerOrderTracking from './pages/customer/CustomerOrderTracking';
import LandingPage from './pages/LandingPage';

// Placeholder components for other pages
const NotFound = () => <div className="p-8 text-center text-red-500">404 - Page Not Found</div>;
const AdminPlaceholder = ({ title = 'Page' }) => <div className="text-2xl font-bold p-6">{title} Page (Coming Soon)</div>;

function App() {
    return (
        <div className="min-h-screen bg-background font-sans text-primary">
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                
                {/* Customer Routes */}
                <Route path="/tracking" element={<CustomerOrderTracking />} />
                
                {/* Station Routes (Kiosk Mode) */}
                <Route path="/station/login" element={<StationLogin />} />
                <Route path="/station" element={<StationDashboard />} />

                {/* Standalone Print Pages (No Layout) */}
                <Route path="/print/work-order/:id" element={<WorkOrderPrint />} />

                {/* Admin Routes (Protected) */}
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

                {/* Redirects / Landing */}
                <Route path="/" element={<LandingPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </div>
    );
}

export default App;
