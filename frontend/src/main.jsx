import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import './index.css';
import authService from './services/authService';
import { stationService } from './services/stationService';
import ErrorBoundary from './components/common/ErrorBoundary';

// Initialize auth state from localStorage on app startup
try { authService.initAuth(); } catch (e) { console.error('[auth] Admin auth init failed:', e); }
try { stationService.initAuth(); } catch (e) { console.error('[auth] Station auth init failed:', e); }

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes — prevents excessive re-fetching
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <ErrorBoundary>
                    <App />
                </ErrorBoundary>
            </BrowserRouter>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    </React.StrictMode>,
);
