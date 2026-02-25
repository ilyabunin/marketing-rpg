"use client";

import { InputHTMLAttributes } from "react";

interface RPGInputProps extends InputHTMLAttributes<HTMLInputElement> {
  fullWidth?: boolean;
}

export default function RPGInput({
  fullWidth = true,
  className = "",
  ...props
}: RPGInputProps) {
  return (
    <input
      className={`font-vt323 text-lg bg-[#0f0f23] border-2 border-[#e0d5c1] text-[#e0d5c1] px-3 py-2 outline-none placeholder-[#4a4a6a] focus:border-[#f0c040] disabled:opacity-50 ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      style={{ borderRadius: 0, imageRendering: "pixelated" }}
      {...props}
    />
  );
}
