import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';

import { MusicProvider } from '@/contexts/MusicContext';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Quiz from '@/pages/Quiz';
import Results from '@/pages/Results';
import History from '@/pages/History';
import Subscribe from '@/pages/Subscribe';
import SubscribeVerify from '@/pages/SubscribeVerify';
import Admin from '@/pages/Admin';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { playClickSound } from '@/lib/clickSound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Reset scroll to top on every route change */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/quiz/:sessionId" component={Quiz} />
      <Route path="/results/:sessionId" component={Results} />
      <Route path="/history" component={History} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/subscribe/verify" component={SubscribeVerify} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      {/* Hidden Admin Route */}
      <Route path="/xk9admin2024" component={Admin} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  // ── Global click sound on every button / link / select ──────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"], select, label')) {
        playClickSound();
      }
    };
    document.addEventListener('click', handler, { passive: true });
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MusicProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </MusicProvider>
    </QueryClientProvider>
  );
}

export default App;
