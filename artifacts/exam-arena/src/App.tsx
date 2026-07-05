import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
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
      {/* Hidden Admin Route */}
      <Route path="/xk9admin2024" component={Admin} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
