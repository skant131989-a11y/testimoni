import { createClient } from "@/lib/supabase/server";
import DemoClient from "./demo-client";

export default async function DemoPage() {
  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch {
    isLoggedIn = false;
  }

  return <DemoClient isLoggedIn={isLoggedIn} />;
}
