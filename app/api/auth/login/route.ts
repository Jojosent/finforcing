import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.identifier || body.email;
    const password = body.password;
    if (!identifier) {
      return NextResponse.json({ error: "Email or name is required." }, { status: 400 });
    }

    const user = await BankDatabase.authenticate(identifier, password);
    if (!user) {
      return NextResponse.json(
        { error: "Неверный логин или пароль. Проверьте данные или зарегистрируйтесь." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
