import { Layout } from '@/components/Layout';
import { useRegisterUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Loader2, UserPlus, Mail } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Register() {
  const register = useRegisterUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setEmailSent(values.email);
      },
      onError: (err: any) => {
        toast({ title: 'Registration failed', description: err.error || 'Could not create account.', variant: 'destructive' });
      },
    });
  };

  if (emailSent) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm text-center">
            <div className="card-game p-8 space-y-4">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto border-2 border-secondary">
                <Mail className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-game-title text-xl text-secondary">CHECK YOUR EMAIL</h2>
              <p className="text-white/70 text-sm font-bold leading-relaxed">
                We sent a verification link to
              </p>
              <p className="text-white font-bold text-base">{emailSent}</p>
              <p className="text-white/55 text-sm font-bold leading-relaxed">
                Click the link in the email to activate your account. Then you can log in.
              </p>
              <p className="text-white/35 text-xs mt-2">Don't see it? Check your spam folder.</p>
              <Link href="/login">
                <button className="btn-game w-full py-3 justify-center mt-4">
                  Go to Login
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

          {/* Logo strip */}
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white/40"
              style={{ boxShadow: '0 5px 0 hsl(175 80% 22%), 0 8px 16px rgba(0,0,0,0.4)' }}
            >
              <UserPlus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-game-title text-2xl leading-tight">CREATE ACCOUNT</h1>
            <p className="text-white/55 text-sm font-bold mt-1">Join Quiz Bunker</p>
          </div>

          <div className="card-game p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70 font-bold text-xs uppercase tracking-wider">Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your name"
                          className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/35 focus-visible:ring-secondary focus-visible:border-secondary font-bold h-11 rounded-xl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-accent font-bold text-xs" />
                    </FormItem>
                  )}
                />

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
                          className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/35 focus-visible:ring-secondary focus-visible:border-secondary font-bold h-11 rounded-xl"
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
                      <FormLabel className="text-white/70 font-bold text-xs uppercase tracking-wider">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/35 focus-visible:ring-secondary focus-visible:border-secondary font-bold h-11 rounded-xl tracking-widest"
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
                  disabled={register.isPending}
                >
                  {register.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </button>
              </form>
            </Form>
          </div>

          <p className="text-center text-white/55 text-sm font-bold mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline font-bold">Sign in</Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
