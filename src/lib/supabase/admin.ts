import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client — uses the service_role key to bypass RLS.
 * Only for server-side operations that need to write to Storage or
 * touch tables without user context (e.g. background jobs, uploads
 * on behalf of an authenticated user).
 *
 * NEVER expose this to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Storage bucket for uploaded video testimonials. Public read, so the
 *  hosted wall + embed widget can serve them via CDN without signed
 *  URLs. Delete-on-testimonial-delete is enforced by the delete endpoint. */
export const VIDEO_BUCKET = "testimonial-videos";
