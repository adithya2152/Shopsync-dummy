import { RegisterShop } from "@/db";
import { admin_supabase, supabase } from "@/util/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request)
{
    try {
        
        const body = await req.json()
        const{shopName , lat , long , managerName , managerEmail, managerPassword , mlat , mlong , managerAddress } = body


        console.log("Received Shop Register Request" , {
            shopName,
            lat,
            long,
            managerName,
            managerEmail,
            managerPassword,
            mlat,
            mlong,
            managerAddress
        })
        // Check for missing fields
        if (!shopName || !lat || !long || !managerName || !managerEmail || !managerPassword || !mlat || !mlong || !managerAddress) {
            console.log("Missing fields");
            return new Response(
                JSON.stringify({ error: "Missing fields" }),
                { status: 400, statusText: "Bad Request" }
            );
        }

        const {data , error} = await supabase.auth.signUp({email:managerEmail , password:managerPassword})

        if (error) {
            console.error("❌ Supabase Signup Error:", error.message);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, statusText: "Bad Request" }
            );
        }

        const user = data?.user

        if(!user)
        {
            console.error("User creation failed");
            return new Response(
                JSON.stringify({ error: "User creation failed" }),
                { status: 500, statusText: "Internal Server Error" }
            );
        }

        console.log("�� Supabase Manager  Created:", user.id)

        const dbResponse = await RegisterShop(
            shopName,
            { latitude: lat, longitude: long },
            managerEmail,
            user.id,
            managerName,
            { latitude: mlat, longitude: mlong },
        )

        if (dbResponse?.error) {
            console.error("�� Database Insert Error:", dbResponse.error);
            await admin_supabase.auth.admin.deleteUser(user.id);
            return new Response(
                JSON.stringify({ error: dbResponse.error }),
                { status: 500, statusText: "Internal Server Error" }
            );
        }

        console.log("Shop Registered Successfully" , dbResponse)

        const res = new NextResponse(
            JSON.stringify({message: "Shop Registered Successfully"}),
            { status: 200, statusText: "OK" }
        )

        res.cookies.set(
            "user",
            JSON.stringify({ id: user.id, email: user.email }),
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                path: "/",
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            }
        )

        res.cookies.set("role", "manager", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 1 week
          });

          return res

    } catch (error) {
        console.error("❌ Internal Server Error:", error);
        return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
        );
    }
}