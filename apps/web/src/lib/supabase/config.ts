// Public values: the publishable key is meant to ship in client code.
// Access control lives in the database (row level security).
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://megvsfrjvmjpujarjksx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_H4uyBL0TXOgId15hh4l6Lg_JlUBS5R6";
