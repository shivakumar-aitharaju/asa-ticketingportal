"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import { useAuthStore } from "@/lib/store/auth-store";
import { getRoleHome } from "@/lib/navigation/role-nav";
import type { AuthLoginResponse } from "@/lib/types";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormData) {
    setIsLoading(true);
    try {
      const res = await apiClient.post<AuthLoginResponse>(endpoints.AUTH_LOGIN, values);
      const { user, token, refreshToken } = res.data.data;
      setAuth(user, token, refreshToken);
      toast.success(`Welcome back, ${user.firstName ?? user.email}!`);
      const destination = callbackUrl ?? getRoleHome(user.role);
      router.push(destination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed. Please check your credentials.";
      toast.error("Login failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary p-12 text-white">
        <div className="bg-white rounded-2xl px-8 py-6 mb-10 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ASA — Ashish Shah & Associates" className="h-14 w-auto object-contain" />
        </div>
        <div className="max-w-sm text-center space-y-4">
          <p className="text-lg font-medium text-white/90">
            Centralized support management for your entire organization
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
            {["Smart Ticket Routing", "SLA Tracking", "Real-time Notifications", "Analytics Dashboard"].map((f) => (
              <div key={f} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                <span className="size-1.5 rounded-full bg-white/60 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ASA" className="h-10 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold">Sign in to your account</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Enter your credentials to access the portal
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@asaind.co.in"
                          className="pl-9"
                          autoComplete="email"
                          disabled={isLoading}
                        />
                      </div>
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-10"
                          autoComplete="current-password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
