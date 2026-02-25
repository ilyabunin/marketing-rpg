"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import RPGPanel from "@/components/ui/RPGPanel";
import RPGButton from "@/components/ui/RPGButton";
import RPGInput from "@/components/ui/RPGInput";

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
    <div className="min-h-screen flex items-center justify-center bg-rpg-bg">
      <div className="w-full max-w-sm">
        <RPGPanel>
          {!showGuest ? (
            <form onSubmit={handleSignIn} className="p-4 space-y-4">
              <h1
                className="font-pixel text-sm text-rpg-gold text-center"
                style={{ textShadow: "2px 2px 0 #1a1a2e" }}
              >
                Profee Marketing
                <br />
                Playground
              </h1>

              {error && (
                <div className="font-vt323 text-base text-red-400 bg-red-900/30 p-2">
                  {error}
                </div>
              )}

              <RPGInput
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <RPGInput
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <RPGButton type="submit" disabled={loading} className="w-full">
                {loading ? "..." : "SIGN IN"}
              </RPGButton>

              <div className="border-t-2 border-rpg-border-inner pt-4">
                <RPGButton
                  type="button"
                  variant="secondary"
                  onClick={() => setShowGuest(true)}
                  className="w-full"
                >
                  GUEST MODE
                </RPGButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGuestLogin} className="p-4 space-y-4">
              <h1 className="font-pixel text-sm text-rpg-gold text-center">
                Guest Access
              </h1>
              <p className="font-vt323 text-base text-rpg-border-inner text-center">
                Browse office, AI requires sign in
              </p>

              <RPGInput
                type="text"
                placeholder="Your name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />

              <RPGButton type="submit" className="w-full">
                ENTER
              </RPGButton>

              <RPGButton
                type="button"
                variant="secondary"
                onClick={() => setShowGuest(false)}
                className="w-full"
              >
                BACK
              </RPGButton>
            </form>
          )}
        </RPGPanel>
      </div>
    </div>
  );
}
