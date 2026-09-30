import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Name and Email are required." }, { status: 400 });
    }

    const user = await BankDatabase.registerUser({
      name: body.name,
      email: body.email,
      password: body.password || "password123",
      initialBalance: Number(body.initialBalance) || 500000,
      deviceType: body.deviceType || "DESKTOP"
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
