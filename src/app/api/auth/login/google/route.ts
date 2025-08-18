import { supabase } from "@/util/supabase";
import { redirect } from "next/navigation";


export async function GET() {
  const redirectUrl = process.env.VERCEL_ENV === 'production'
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback';

    const {data} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    })
  
    if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
}
















