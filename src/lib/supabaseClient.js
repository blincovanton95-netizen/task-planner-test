import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.warn(
    "Supabase URL или anon key не заданы. Добавьте их в ..env.local, чтобы включить сохранение данных."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

