import Link from "next/link";
import { SignupForm } from "./signup-form";
import { Hammer } from "lucide-react";
import { env } from "@/lib/env";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <Hammer className="h-5 w-5 text-primary" />
          {env.NEXT_PUBLIC_APP_NAME}
        </Link>
        <SignupForm />
      </div>
    </main>
  );
}
