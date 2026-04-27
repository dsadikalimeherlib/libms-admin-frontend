'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, BookMarked, Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { authenticateUser } from "@/lib/mock-library-api";

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email or username."),
  password: z.string().trim().min(6, "Password must be at least 6 characters."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, signIn } = useAuth();

  // Redirect to dashboard if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "circulation",
      password: "library123",
    },
    mode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: authenticateUser,
    onSuccess: (session) => {
      signIn(session);
      toast.success(`Welcome back, ${session.user.name}.`);
      router.push("/dashboard");
    },
    onError: (error: Error) => {
      form.setError("root", { message: error.message });
    },
  });

  const login = () => {
    window.location.href =
      "https://libms-dev.aakvaerp.com/api/method/frappe.integrations.oauth2.authorize" +
      "?client_id=imdsp6muko" +
      "&redirect_uri=http://localhost:3000/callback" +
      "&response_type=code" +
      "&scope=all";
  };

  const getUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    const { access_token } = JSON.parse(token);
    fetch("/api/users", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })
      .then(res => res.json())
      .then(data => console.log(data));
  }

  const onSubmit = (values: LoginValues) => {
    form.clearErrors("root");
    // loginMutation.mutate({
    //   identifier: values.identifier,
    //   password: values.password,
    // });
    login();
  };
  return (
    <>
      <main className="auth-backdrop min-h-screen px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-stretch gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="panel-surface hidden overflow-hidden bg-hero p-8 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-4">
              <span className="data-chip border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                Library Management System
              </span>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-bold leading-tight">Library Admin Panel built for circulation speed.</h1>
                <p className="max-w-lg text-base text-primary-foreground/80">
                  A focused desk view for issuing, returning, and renewing books without breaking flow.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {/* {featureList.map((item) => (
                <div key={item} className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/10 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5" />
                    <p className="text-sm text-primary-foreground/88">{item}</p>
                  </div>
                </div>
              ))} */}
            </div>
          </section>

          <section className="flex items-center justify-center">
            <Card className="panel-surface w-full max-w-md border-border/70">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-muted p-2 text-foreground">
                    <BookMarked />
                  </span>
                  <div>
                    <CardTitle className="text-2xl">Sign in</CardTitle>
                    <CardDescription>Use your desk credentials to enter the admin panel.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-border/70 bg-muted/50 p-4 text-sm text-muted-foreground">
                  Demo login: <span className="font-semibold text-foreground">circulation</span> / <span className="font-semibold text-foreground">library123</span>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email or username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="admin@citylibrary.io" autoComplete="username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••••" autoComplete="current-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.formState.errors.root?.message ? (
                      <div className="inline-feedback">{form.formState.errors.root.message}</div>
                    ) : null}

                    <Button type="submit" className="w-full" disabled={!form.formState.isValid || loginMutation.isPending}>
                      {loginMutation.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                      Continue to dashboard
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </>
  );
}
