"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1025]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#2a1f3d] p-8 rounded-lg w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">
          Marketing RPG
        </h1>

        {error && (
          <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-3 bg-[#1a1025] border border-[#4a3f5d] rounded text-white placeholder-gray-500 outline-none focus:border-amber-400"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 bg-[#1a1025] border border-[#4a3f5d] rounded text-white placeholder-gray-500 outline-none focus:border-amber-400"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded disabled:opacity-50"
        >
          {loading ? "..." : isSignUp ? "Регистрация" : "Войти"}
        </button>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-3 text-gray-400 text-sm hover:text-amber-400"
        >
          {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Регистрация"}
        </button>
      </form>
    </div>
  );
}
