"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface RPGButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function RPGButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: RPGButtonProps) {
  const base =
    "rpg-button font-pixel text-xs px-4 py-2 border-2 transition-colors";
  const variants = {
    primary:
      "bg-[#1a1a2e] border-[#e0d5c1] text-[#f0c040] hover:bg-[#f0c040] hover:text-[#1a1a2e]",
    secondary:
      "bg-[#1a1a2e] border-[#4a4a6a] text-[#e0d5c1] hover:bg-[#4a4a6a] hover:text-white",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{ borderRadius: 0, imageRendering: "pixelated" }}
      {...props}
    >
      {children}
    </button>
  );
}
