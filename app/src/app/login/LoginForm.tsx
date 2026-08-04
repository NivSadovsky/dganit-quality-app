"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input
        type="password"
        inputMode="numeric"
        pattern="\d{9}"
        maxLength={9}
        name="code"
        autoFocus
        placeholder="000000000"
        className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-center text-2xl tracking-[0.3em] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      {state?.error && (
        <p className="text-center text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "מתחבר/ת..." : "כניסה"}
      </button>
    </form>
  );
}
