import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Валидация на этапе сборки (Fail Fast)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Missing Supabase environment variables. Please check your .env.local file."
    );
}

// Создание клиента с явной конфигурацией
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        // detectSessionInUrl: true, // для OAuth редиректов
    },
    // Опции для отладки в разработке
    // ...(process.env.NODE_ENV === 'development' && {
    //   debug: { log: console.log },
    // }),
});