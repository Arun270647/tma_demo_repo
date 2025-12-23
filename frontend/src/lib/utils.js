import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes without conflicts.
 * This is required for the UI components to handle custom className overrides.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}