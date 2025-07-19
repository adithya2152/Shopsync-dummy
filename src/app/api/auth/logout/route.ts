import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";
import { useAuthStore } from "@/store/useAuthStore"; // Import Zustand store

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );

    // ✅ Delete Cookies
    response.cookies.delete("user");
    response.cookies.delete("role");

    // ✅ Reset Role in Zustand
    console.log("🔄 Resetting Zustand Store Role");
    useAuthStore.getState().resetRole();

    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in POST /api/auth/signout:", error);
      return new Response(
        JSON.stringify({ message: "Internal Server Error" }),
        { status: 500 }
      );
    }
  }
}
