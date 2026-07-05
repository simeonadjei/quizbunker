import { Layout } from '@/components/Layout';
import { useForgotPassword } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Loader2, KeyRound, Mail } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email(),
});

export default function ForgotPassword() {
  const forgotPassword = useForgotPassword();
  const [emailSent, setEmailSent] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (values: z.infer<typeof forgotSchema>) => {
    forgotPassword.mutate({ data: values }, {
      onSuccess: () => setEmailSent(values.email),
      onError: () => setEmailSent(values.email),
    });
  };

  if (emailSent) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm text-center">
            <div className="card-game p-8 space-y-4">
              <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto border-2 border-secondary">
                <Mail className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-game-title text-xl text-secondary">CHECK YOUR EMAIL</h2>
              <p className="text-white/70 text-sm font-bold leading-relaxed">
                If an account exists for
              </p>
              <p className="text-white font-bold text-base">{emailSent}</p>
              <p className="text-white/55 text-sm font-bold leading-relaxed">
                we sent a link to reset your password. It expires in 1 hour.
              </p>
              <p className="text-white/35 text-xs mt-2">Don't see it? Check your spam folder.</p>
              <Link href="/login">
                <button className="btn-game w-full py-3 justify-center mt-4">
                  Back to Login
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
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-sm">

          <div className="text-center mb-6">
            <div
              className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 border-2 border-white/40"
              style={{ boxShadow: '0 5px 0 hsl(22 90% 30%), 0 8px 16px rgba(0,0,0,0.4)' }}
            >
              <KeyRound className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-game-title text-2xl leading-tight">FORGOT PASSWORD?</h1>
            <p className="text-white/55 text-sm font-bold mt-1">We'll email you a reset link</p>
          </div>

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

                <button
                  type="submit"
                  className="btn-game w-full py-3.5 text-base justify-center mt-1"
                  disabled={forgotPassword.isPending}
                >
                  {forgotPassword.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </button>
              </form>
            </Form>
          </div>

          <p className="text-center text-white/55 text-sm font-bold mt-4">
            Remembered it?{' '}
            <Link href="/login" className="text-accent hover:underline font-bold">Back to Sign In</Link>
          </p>

        </div>
      </div>
    </Layout>
  );
}
