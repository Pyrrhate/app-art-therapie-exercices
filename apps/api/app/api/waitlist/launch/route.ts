import { resolveFreemiumContext } from "@/lib/auth/freemium";
import { sendLaunchWaitlistConfirmation } from "@/lib/email/resend";
import {
  corsHeaders,
  errorResponse,
  handleOptions,
  jsonResponse,
} from "@/lib/cors";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function OPTIONS(request: Request) {
  return handleOptions(request);
}

/** Inscription alerte lancement officiel (+ email de confirmation si Resend configuré). */
export async function POST(request: Request) {
  const ctx = await resolveFreemiumContext(request);
  if (!ctx.userId) {
    return errorResponse(
      request,
      { error: "Non authentifié.", code: "VALIDATION_ERROR" },
      401
    );
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return errorResponse(
      request,
      { error: "Service indisponible.", code: "INTERNAL_ERROR" },
      503
    );
  }

  const { data: profile } = await admin
    .from("users")
    .select("email")
    .eq("id", ctx.userId)
    .maybeSingle();

  const email = profile?.email?.trim();
  if (!email) {
    return errorResponse(
      request,
      { error: "Email du compte introuvable.", code: "VALIDATION_ERROR" },
      400
    );
  }

  const { error } = await admin.from("launch_waitlist").upsert(
    { user_id: ctx.userId, email },
    { onConflict: "user_id" }
  );

  if (error) {
    console.warn("[waitlist]", error.message);
    return errorResponse(
      request,
      { error: "Inscription impossible.", code: "INTERNAL_ERROR" },
      500
    );
  }

  const emailSent = await sendLaunchWaitlistConfirmation(email);

  return jsonResponse(
    {
      subscribed: true,
      emailSent,
      message: emailSent
        ? "Inscription enregistrée — vérifiez votre boîte mail."
        : "Inscription enregistrée.",
    },
    request
  );
}

export async function GET() {
  return new Response(
    JSON.stringify({ message: "Utilisez POST (authentifié)" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders(null) },
    }
  );
}
