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



  return (
    <>
      {/* flex items-center justify-center relative overflow-hidden */}
      <main className="auth-backdrop min-h-screen px-4 py-4 sm:px-6 lg:px-8 ">

        <img src="/login-bg.png" className="absolute left-0 top-0 w-full h-auto z-0" /> {/* Background image */}
        <div className="mx-auto   max-w-[500px] flex-col items-center gap-6 lg:flex">
          {/* <section className="panel-surface hidden overflow-hidden  p-8  lg:flex lg:flex-col lg:justify-between"> */}

          <div className="space-y-4 flex flex-col items-center justify-center text-center min-h-[calc(100vh)]">
            {/* <span className="data-chip border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                Library Management System
              </span> */}
            <div className="space-y-8  relative z-10 h-[460px] flex flex-col  bg-[#fff] rounded-lg p-8 shadow-lg">
              {/* <h1 className="max-w-xl text-3xl font-bold leading-tight">Library Management System</h1> */}
              {/* <p className="max-w-lg text-base text-primary-foreground/80">
                  A focused desk view for issuing, returning, and renewing books without breaking flow.
                </p> */}
              <div className="flex justify-center ">
                <img src="/logo-2.svg" alt="Library Logo" className="mb-6 w-[300px]" />
              </div>
              <Button onClick={login} className="w-[300px] cursor-pointer  text-[20px] font-bold h-auto bg-transparent !shadow-none hover:bg-transparent"  >
                {/* {loginMutation.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />} */}
                {/* Login to Admin Panel */}
                <img src="/login-btn.jpg" className="w-full h-auto" />
              </Button>
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
          {/* </section> */}

          {/* <section className="flex items-center justify-center">
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

                    
                  </form>
                </Form>
              </CardContent>
            </Card>
          </section> */}
        </div>
      </main>
    </>
  );
}
