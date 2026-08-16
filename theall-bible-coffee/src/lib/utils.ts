import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 65 → "65 เปอร์เซ็นต์" for screen readers, without relying on the % glyph. */
export function thaiPercentLabel(percent: number, context: string): string {
  return `${context} ${Math.round(percent)} เปอร์เซ็นต์`;
}
