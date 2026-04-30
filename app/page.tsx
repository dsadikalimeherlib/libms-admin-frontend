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

          <div className="space-y-4 flex flex-col items-center justify-center text-center min-h-[calc(100vh)]">

            <div className="space-y-8  relative z-10 h-[460px] flex flex-col  bg-[#fff] rounded-lg p-8 shadow-lg">

              <div className="flex justify-center ">
                <img src="/logo-2.svg" alt="Library Logo" className="mb-6 w-[300px]" />
              </div>
              <Button onClick={login} className="w-[300px] cursor-pointer  text-[20px] font-bold h-auto bg-transparent !shadow-none hover:bg-transparent"  >
                {/* Login to Admin Panel */}
                <img src="/login-btn.jpg" className="w-full h-auto" />
              </Button>
            </div>
          </div>


        </div>
      </main>
    </>
  );
}
