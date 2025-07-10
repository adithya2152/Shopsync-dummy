import { supabase } from "@/util/supabase";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
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