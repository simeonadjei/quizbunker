import { Layout } from '@/components/Layout';
import { useResetPassword } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, CheckCircle2, XCircle } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ResetPassword() {
  const resetPassword = useResetPassword();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  const form = useForm<z.infer<typeof resetSchema>>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (values: z.infer<typeof resetSchema>) => {
    if (!token) return;
    resetPassword.mutate({ data: { token, password: values.password } }, {
      onSuccess: () => {
        toast({ title: 'Password reset!', description: 'You can now log in with your new password.' });
        setLocation('/login');
      },
      onError: (err: any) => {
        toast({ title: 'Reset failed', description: err?.error || 'Invalid or expired reset link.', variant: 'destructive' });
      },
    });
  };

  if (!token) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm text-center">
            <div className="card-game p-8 space-y-4">
              <XCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h2 className="text-game-title text-xl text-red-400">MISSING LINK</h2>
              <p className="text-white/70 text-sm font-bold">
                This page needs a valid reset link from your email.
              </p>
              <Link href="/forgot-password">
                <button className="btn-game w-full py-3 justify-center mt-2">
                  Request a New Link
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-sm">

          <div className="text-center mb-6">
            <div
              className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white/40"
              style={{ boxShadow: '0 5px 0 hsl(22 90% 30%), 0 8px 16px rgba(0,0,0,0.4)' }}
            >
              <KeyRound className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-game-title text-2xl leading-tight">RESET PASSWORD</h1>
            <p className="text-white/55 text-sm font-bold mt-1">Choose a new password</p>
          </div>

          <div className="card-game p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 font-bold text-xs uppercase tracking-wider">New Password</FormLabel>
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 font-bold text-xs uppercase tracking-wider">Confirm Password</FormLabel>
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

                <button
                  type="submit"
                  className="btn-game w-full py-3.5 text-base justify-center mt-1"
                  disabled={resetPassword.isPending}
                >
                  {resetPassword.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            </Form>
          </div>

        </div>
      </div>
    </Layout>
  );
}
