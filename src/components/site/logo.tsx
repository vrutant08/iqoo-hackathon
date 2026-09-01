"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * ProtoPatch Official Brand Mark
 * Graphic:
 * - Upper amber circle with 3 coral dots and dark structural border
 * - Lower indigo/purple hemisphere with dark structural border
 * Vector-rendered for crisp display at all resolutions.
 */
export function ProtoPatchLogo({ className, size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-300 group-hover:scale-105", className)}
      aria-hidden="true"
    >
      {/* Upper Circle (Orange/Amber with Dark Border) */}
      <circle
        cx="50"
        cy="36"
        r="28"
        fill="#FF9E00"
        stroke="#111111"
        strokeWidth="6.5"
      />

      {/* 3 Coral Inner Core Dots */}
      <circle cx="42" cy="26" r="4.5" fill="#EF4444" />
      <circle cx="58" cy="34" r="4.5" fill="#EF4444" />
      <circle cx="43" cy="44" r="4.5" fill="#EF4444" />

      {/* Lower Hemisphere (Indigo/Purple with Dark Border) */}
      <path
        d="M 16 68 C 16 88 31 104 50 104 C 69 104 84 88 84 68 Z"
        fill="#4F46E5"
        stroke="#111111"
        strokeWidth="6.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
