"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, UserCircle, Lock, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import { useAuthStore } from "@/lib/store/auth-store";

const ProfileSchema = z.object({
  firstName: z.string().min(1).max(255).optional().or(z.literal("")),
  lastName: z.string().min(1).max(255).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});
type ProfileForm = z.infer<typeof ProfileSchema>;

const PasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof PasswordSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const qc = useQueryClient();
  const [emailNotifs, setEmailNotifs] = useState(
    !!(user?.notificationPrefs as any)?.email
  );
  const [pushNotifs, setPushNotifs] = useState(
    !!(user?.notificationPrefs as any)?.push
  );

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: (user as any)?.phone ?? "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) =>
      apiClient.patch<{ data: typeof user }>(endpoints.USERS_PROFILE, data),
    onSuccess: (res) => {
      if (res.data.data) updateUser(res.data.data as any);
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const updateNotifications = useMutation({
    mutationFn: (prefs: Record<string, boolean>) =>
      apiClient.patch(endpoints.USERS_PROFILE, { notificationPrefs: prefs }),
    onSuccess: () => toast.success("Notification preferences saved"),
    onError: () => toast.error("Failed to save preferences"),
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      apiClient.patch(endpoints.USERS_PROFILE, { password: data.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Password changed successfully");
    },
    onError: () => toast.error("Failed to change password"),
  });

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : user?.email ?? "";
  const initials = (user?.firstName?.[0] ?? user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="size-4" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
            <div>
              <p className="font-semibold text-lg">{displayName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs capitalize">
                {user?.role?.replace("_", " ")}
              </Badge>
            </div>
          </div>

          <Separator />

          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField control={profileForm.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={profileForm.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={profileForm.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input {...field} placeholder="+1 555 000 0000" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Loader2 className="size-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-4" />
            Change Password
          </CardTitle>
          <CardDescription className="text-xs">Choose a strong password of at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
              className="space-y-4"
            >
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input {...field} type="password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl><Input {...field} type="password" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" size="sm" disabled={changePassword.isPending}>
                {changePassword.isPending && <Loader2 className="size-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            {
              id: "email",
              label: "Email Notifications",
              desc: "Receive ticket updates and status changes by email",
              value: emailNotifs,
              onChange: (v: boolean) => {
                setEmailNotifs(v);
                updateNotifications.mutate({ email: v, push: pushNotifs });
              },
            },
            {
              id: "push",
              label: "In-app Notifications",
              desc: "Show badge and alerts inside the portal",
              value: pushNotifs,
              onChange: (v: boolean) => {
                setPushNotifs(v);
                updateNotifications.mutate({ email: emailNotifs, push: v });
              },
            },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={item.value} onCheckedChange={item.onChange} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{user?.role?.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account status</span>
            <Badge variant={user?.isActive ? "default" : "destructive"} className="text-xs">
              {user?.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {user?.lastLoginAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last login</span>
              <span className="font-medium">
                {new Date(user.lastLoginAt).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
