import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, Factory } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const user = authService.getStoredUser();
      if (user) {
        if (user.role === 'admin' || user.role === 'manager') {
          navigate('/admin');
        } else if (user.is_station) {
          navigate('/station');
        } else if (user.role === 'customer') {
          navigate('/tracking');
        } else {
          navigate('/admin');
        }
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData.email, formData.password);
      const user = response.user;

      // Redirect based on role
      if (user.role === 'admin' || user.role === 'manager') {
        navigate('/admin');
      } else if (user.is_station) {
        navigate('/station');
      } else if (user.role === 'customer') {
        navigate('/tracking');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login gagal. Periksa email dan password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex min-h-[500px] border border-slate-100">
        {/* Left Side: Illustration - Hidden on small screens */}
        <div className="hidden md:flex w-5/12 relative bg-slate-100 items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center opacity-90"
            style={{ 
              backgroundImage: "url('/login_bg.png')"
            }}
          ></div>
          <div className="absolute inset-0 bg-blue-600/10 mix-blend-multiply"></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-white relative">
          {/* Switch to Station Button - Absolute positioned for clean look */}
          <button 
            onClick={() => navigate('/station/login')}
            className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-xl transition-all border border-slate-100 group"
          >
            <Factory size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="text-xs font-bold">STATION LOGIN</span>
          </button>

          {/* Logo Area */}
          <div className="mb-8">
            <div className="flex items-center gap-1 text-2xl font-bold tracking-tight">
                <span className="text-red-500">N</span>
                <span className="text-blue-500">K</span>
                <span className="text-green-500">i</span>
                <span className="text-yellow-500">d</span>
                <span className="text-indigo-500">s</span>
                <span className="text-slate-400 ml-2 text-base font-semibold opacity-80 uppercase tracking-widest">System</span>
            </div>
          </div>

          {/* Header Text */}
          <div className="mb-8">
            <h3 className="text-slate-800 text-xl font-bold leading-tight mb-1">Admin Portal</h3>
            <p className="text-slate-400 text-xs">Silakan masuk untuk mengelola produksi.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="email" 
                className="text-slate-600 text-[11px] font-bold uppercase tracking-wider ml-1"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@nkids.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex h-11 w-full rounded-xl border-none bg-slate-50 px-3 py-2 pl-11 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label 
                  htmlFor="password" 
                  className="text-slate-600 text-[11px] font-bold uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex h-11 w-full rounded-xl border-none bg-slate-50 px-3 py-2 pl-11 pr-11 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 hover:text-slate-500 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'MASUK KE DASHBOARD'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} NKids Production System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
