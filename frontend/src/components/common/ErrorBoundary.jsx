import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("[Uncaught Error] App crashed:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = "/";
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 font-sans">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
                        
                        {/* Error Icon */}
                        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/30 rounded-2xl flex items-center justify-center text-red-500 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                <line x1="12" x2="12" y1="9" y2="13"/>
                                <line x1="12" x2="12.01" y1="17" y2="17"/>
                            </svg>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Oops! Something went wrong.</h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                                Aplikasi mengalami kesalahan tidak terduga. Silakan muat ulang halaman atau kembali ke Beranda.
                            </p>
                        </div>

                        {/* Error Details Accordion */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="text-left bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                                <summary className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:text-slate-600 transition-colors">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 text-[10px] text-red-600 dark:text-red-400 font-mono overflow-auto max-h-40 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {"\n\n"}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                onClick={this.handleReload}
                                className="flex-1 h-12 bg-slate-900 dark:bg-primary text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 hover:translate-y-[-1px]"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95"
                            >
                                Go Back Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
