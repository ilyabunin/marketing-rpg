"use client";

import RPGButton from "./ui/RPGButton";
import { supabase } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface Props {
  isGuest: boolean;
}

export default function Header({ isGuest }: Props) {
  const router = useRouter();

  async function handleLogout() {
    if (isGuest) {
      localStorage.removeItem("guest_name");
      localStorage.removeItem("guest_mode");
    } else {
      await supabase.auth.signOut();
    }
    router.push("/login");
  }

  const name = isGuest
    ? localStorage.getItem("guest_name") || "Guest"
    : "Player";

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b-2 border-rpg-border">
      <h1
        className="font-pixel text-rpg-gold"
        style={{ fontSize: 26, fontWeight: 700, textShadow: "2px 2px 0 #1a1a2e, 1px 1px 0 #4a4a6a" }}
      >
        Profee Marketing Playground
      </h1>
      <div className="flex items-center gap-3">
        <span className="font-body text-base text-rpg-text">{name}</span>
        <RPGButton variant="secondary" onClick={handleLogout}>
          EXIT
        </RPGButton>
      </div>
    </div>
  );
}
