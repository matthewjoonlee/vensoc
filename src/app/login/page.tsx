"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/");
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsOAuthLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    setIsOAuthLoading(false);

    if (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Supabase Auth
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Log in</h1>
          <p className="mt-2 text-sm text-slate-400">
            Access your account with your email and password.
          </p>
        </div>

        <button
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
          type="button"
          onClick={handleGoogleLogin}
          disabled={isOAuthLoading}
        >
          {isOAuthLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          or
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none ring-offset-2 ring-offset-slate-950 focus:border-transparent focus:ring-2 focus:ring-cyan-400"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            Password
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none ring-offset-2 ring-offset-slate-950 focus:border-transparent focus:ring-2 focus:ring-cyan-400"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Need an account?{" "}
          <Link className="font-semibold text-cyan-300" href="/signup">
            Create one
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
