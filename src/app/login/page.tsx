"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guestName, setGuestName] = useState("");
  const [showGuest, setShowGuest] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/");
    });
    if (localStorage.getItem("guest_name")) router.replace("/");
  }, [router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  function handleGuestLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    localStorage.setItem("guest_name", guestName.trim());
    localStorage.setItem("guest_mode", "true");
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1025]">
      <div className="w-full max-w-sm">
        {!showGuest ? (
          <form
            onSubmit={handleSignIn}
            className="bg-[#2a1f3d] p-8 rounded-lg"
          >
            <h1 className="text-2xl font-bold text-amber-400 mb-6 text-center">
              Profee Marketing Playground
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
              placeholder="Password"
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
              {loading ? "..." : "Sign In"}
            </button>

            <div className="mt-4 pt-4 border-t border-[#4a3f5d]">
              <button
                type="button"
                onClick={() => setShowGuest(true)}
                className="w-full p-3 bg-[#1a1025] border border-[#4a3f5d] hover:border-amber-400 text-gray-300 rounded text-sm"
              >
                Continue as Guest
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleGuestLogin}
            className="bg-[#2a1f3d] p-8 rounded-lg"
          >
            <h1 className="text-2xl font-bold text-amber-400 mb-2 text-center">
              Guest Access
            </h1>
            <p className="text-gray-500 text-xs text-center mb-6">
              Browse the office, but AI features require sign in
            </p>

            <input
              type="text"
              placeholder="Your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full p-3 mb-4 bg-[#1a1025] border border-[#4a3f5d] rounded text-white placeholder-gray-500 outline-none focus:border-amber-400"
              required
            />

            <button
              type="submit"
              className="w-full p-3 bg-[#4a3f5d] hover:bg-[#5a4f6d] text-white font-bold rounded"
            >
              Enter as Guest
            </button>

            <button
              type="button"
              onClick={() => setShowGuest(false)}
              className="w-full mt-3 text-gray-400 text-sm hover:text-amber-400"
            >
              Back to Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
