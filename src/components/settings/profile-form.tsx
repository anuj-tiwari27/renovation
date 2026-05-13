"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  updateEmailAction,
  updatePasswordAction,
  updateProfileAction,
} from "@/lib/actions/profile";

interface Props {
  initial: {
    full_name: string;
    email: string;
    phone: string | null;
    role: string;
    is_active: boolean;
  };
}

export function ProfileForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  const [name, setName] = React.useState(initial.full_name);
  const [phone, setPhone] = React.useState(initial.phone ?? "");

  const [email, setEmail] = React.useState(initial.email);

  const [pw1, setPw1] = React.useState("");
  const [pw2, setPw2] = React.useState("");

  const saveProfile = () => {
    startTransition(async () => {
      try {
        await updateProfileAction({ full_name: name, phone: phone || null });
        toast.success("Profile updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update profile");
      }
    });
  };

  const saveEmail = () => {
    startTransition(async () => {
      try {
        const res = await updateEmailAction(email);
        if (res.requiresConfirmation) {
          toast.success("Confirmation links sent to your old and new email addresses.", {
            description: "The change finalises after you click both.",
          });
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update email");
      }
    });
  };

  const savePassword = () => {
    if (pw1 !== pw2) {
      toast.warning("The two passwords don't match.");
      return;
    }
    startTransition(async () => {
      try {
        await updatePasswordAction(pw1);
        setPw1("");
        setPw2("");
        toast.success("Password updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update password");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal information</CardTitle>
          <CardDescription>
            Your role is{" "}
            <Badge variant="secondary" className="capitalize">
              {initial.role.replace("_", " ")}
            </Badge>
            {!initial.is_active && (
              <Badge variant="warning" className="ml-2">
                Inactive
              </Badge>
            )}
            . Only an admin can change roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={saveProfile} disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account email</CardTitle>
          <CardDescription>
            Changing your email requires confirmation from both the old and the new address before
            it goes live.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={saveEmail}
            disabled={isPending || email === initial.email}
          >
            Update email
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>
            At least 8 characters. We don't enforce special-character rules, but a passphrase is
            safer than a short password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pw1">New password</Label>
            <Input
              id="pw1"
              type="password"
              autoComplete="new-password"
              value={pw1}
              onChange={(e) => setPw1(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Confirm new password</Label>
            <Input
              id="pw2"
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={savePassword} disabled={isPending || pw1.length < 8 || pw1 !== pw2}>
              {isPending ? "Saving…" : "Update password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
