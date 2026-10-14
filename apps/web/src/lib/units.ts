// Everything is stored in metric. These helpers convert for display and input.

export type UnitSystem = "metric" | "imperial";

export function unitSystemFor(profile: { unit_system: string | null; country: string | null } | null): UnitSystem {
  if (profile?.unit_system === "metric" || profile?.unit_system === "imperial") return profile.unit_system;
  // Default to imperial for the US (and when the country is unknown, since most users are US-based).
  return !profile?.country || profile.country === "US" ? "imperial" : "metric";
}

export const lengthUnit = (u: UnitSystem) => (u === "imperial" ? "in" : "cm");
export const tempUnit = (u: UnitSystem) => (u === "imperial" ? "°F" : "°C");

export const toCm = (value: number, u: UnitSystem) => (u === "imperial" ? value * 2.54 : value);
export const fromCm = (cm: number, u: UnitSystem) => (u === "imperial" ? cm / 2.54 : cm);
export const toC = (value: number, u: UnitSystem) => (u === "imperial" ? ((value - 32) * 5) / 9 : value);
export const fromC = (c: number, u: UnitSystem) => (u === "imperial" ? (c * 9) / 5 + 32 : c);

export const round = (n: number, places = 1) => Math.round(n * 10 ** places) / 10 ** places;
