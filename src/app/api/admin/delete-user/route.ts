import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

// Валидация схемы запроса
const DeleteUserSchema = z.object({
  userId: z.string().uuid("Невалидный формат UUID"),
});

export async function POST(request: Request) {
  // Проверка конфигурации
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("[DeleteUser] Missing environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Проверка авторизации
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
    error: callerErr,
  } = await userClient.auth.getUser(token);

  if (callerErr || !caller) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Валидация тела запроса
  let jsonBody: unknown;
  try {
    jsonBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validation = DeleteUserSchema.safeParse(jsonBody);
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: "Validation failed", 
        details: validation.error.issues
      },
      { status: 400 }
    );
  }
  const { userId: targetUserId } = validation.data;

  // Защита от самоудаления
  if (targetUserId === caller.id) {
    return NextResponse.json(
      { error: "Cannot delete yourself" },
      { status: 400 }
    );
  }

  // Проверка прав Администратора
  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile, error: profErr } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profErr || profile?.role !== "admin") {
    console.warn(`[DeleteUser] Forbidden attempt by ${caller.id}`);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Процесс удаления
  try {
    // Удалят профиль (CASCADE удалит задачи и настройки в БД)
    const { error: deleteProfileErr } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    if (deleteProfileErr) {
      throw new Error(`Profile deletion failed: ${deleteProfileErr.message}`);
    }

    // Удаляет пользователя из Auth
    const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(
      targetUserId
    );

    if (delAuthErr) {
      console.error(`[DeleteUser] Auth deletion failed for ${targetUserId}`, delAuthErr);
      throw new Error("Failed to remove authentication credentials");
    }

    // Запись в аудит
    await adminClient.from("audit_logs").insert({
      action: "USER_DELETED",
      admin_id: caller.id,
      target_id: targetUserId,
    });

    console.log(`[Audit] Admin ${caller.id} deleted user ${targetUserId}`);

    return NextResponse.json({ ok: true });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DeleteUser] Critical Error:", message);
    
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}