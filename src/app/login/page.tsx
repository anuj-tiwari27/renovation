import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { BrandMark } from "@/components/brand";
import { env } from "@/lib/env";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold">
          <BrandMark size={28} />
          {env.NEXT_PUBLIC_APP_NAME}
        </Link>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
