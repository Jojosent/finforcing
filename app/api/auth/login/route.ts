import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.email;
    if (!identifier) {
      return NextResponse.json({ error: "Email or name is required." }, { status: 400 });
    }

    const user = await BankDatabase.authenticate(identifier);
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден. Пожалуйста, зарегистрируйтесь." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
