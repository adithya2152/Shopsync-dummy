import { supabase } from "@/util/supabase";
import { redirect } from "next/navigation";

export async function GET() {
    const {data} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/api/auth/callback'
      }
    })
  
    if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
}


