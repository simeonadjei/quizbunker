import { Layout } from '@/components/Layout';
import { useLoginUser, useResendVerification, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, LogIn, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export default function Login() {
  const login = useLoginUser();
  const resend = useResendVerification();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resentOk, setResentOk] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  // Support ?next= redirect after login (used by verify page when session expires)
  const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard';

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setUnverifiedEmail(null);
    setResentOk(false);
    login.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation(nextUrl);
      },
      onError: (err: any) => {
        const msg = err?.error || err?.message || 'Invalid email or password.';
        const isUnverified = msg.toLowerCase().includes('verify your email');
        if (isUnverified) {
          setUnverifiedEmail(values.email);
        } else {
          toast({ title: 'Login failed', description: msg, variant: 'destructive' });
        }
      },
    });
  };

  const handleResend = () => {
    if (!unverifiedEmail) return;
    setResentOk(false);
    resend.mutate({ data: { email: unverifiedEmail } }, {
      onSuccess: () => setResentOk(true),
      onError: () => toast({ title: 'Could not resend', description: 'Please try again shortly.', variant: 'destructive' }),
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-sm">

          {/* Logo strip */}
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white/40"
              style={{ boxShadow: '0 5px 0 hsl(22 90% 30%), 0 8px 16px rgba(0,0,0,0.4)' }}
            >
              <LogIn className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-game-title text-2xl leading-tight">WELCOME BACK</h1>
            <p className="text-white/55 text-sm font-bold mt-1">Sign in to Quiz Bunker</p>
          </div>

          {unverifiedEmail ? (
            <div className="card-game p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center mx-auto border-2 border-secondary">
                <Mail className="w-7 h-7 text-secondary" />
              </div>
              <h2 className="text-game-title text-lg text-secondary">VERIFY YOUR EMAIL</h2>
              <p className="text-white/70 text-sm font-bold leading-relaxed">
                Your account isn't verified yet. Check your inbox for the link we sent to:
              </p>
              <p className="text-white font-bold text-sm">{unverifiedEmail}</p>

              {resentOk ? (
                <p className="text-secondary text-sm font-bold">✅ New link sent! Check your inbox.</p>
              ) : (
                <button
                  className="btn-game w-full py-3 justify-center text-sm"
                  onClick={handleResend}
                  disabled={resend.isPending}
                >
                  {resend.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend verification email'}
                </button>
              )}

              <button
                className="text-white/40 text-xs font-bold hover:text-white/70 transition-colors"
                onClick={() => { setUnverifiedEmail(null); setResentOk(false); }}
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <div className="card-game p-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/70 font-bold text-xs uppercase tracking-wider">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/35 focus-visible:ring-primary focus-visible:border-primary font-bold h-11 rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-accent font-bold text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-white/70 font-bold text-xs uppercase tracking-wider">Password</FormLabel>
                          <Link href="/forgot-password" className="text-accent hover:underline font-bold text-xs">
                            Forgot?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/35 focus-visible:ring-primary focus-visible:border-primary font-bold h-11 rounded-xl tracking-widest"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-accent font-bold text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                        </FormControl>
                        <FormLabel className="text-white/70 font-bold text-xs cursor-pointer !mt-0">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <button
                    type="submit"
                    className="btn-game w-full py-3.5 text-base justify-center mt-1"
                    disabled={login.isPending}
                  >
                    {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                  </button>
                </form>
              </Form>
            </div>
          )}

          <p className="text-center text-white/55 text-sm font-bold mt-4">
            New here?{' '}
            <Link href="/register" className="text-accent hover:underline font-bold">Create an account</Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
