import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#e2e8f0,_#0f172a)] px-6 py-20 text-slate-950">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 rounded-[32px] border border-white/40 bg-white/80 p-10 shadow-2xl backdrop-blur sm:p-14">
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
            Next.js + Supabase
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Launch-ready auth &amp; database starter.
          </h1>
          <p className="max-w-2xl text-lg text-slate-600">
            Connect your Supabase project, then jump into login and signup flows
            powered by the Supabase JS client.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/login"
          >
            Log in
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-100"
            href="/signup"
          >
            Create account
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Quick setup</p>
          <p className="mt-2">
            Add your Supabase URL and anon key in <code>.env.local</code>, then
            run <code>npm run dev</code> to try the flow.
          </p>
        </div>
      </main>
    </div>
  );
}
