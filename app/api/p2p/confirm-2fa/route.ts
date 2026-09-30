import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txId, otp } = body;

    if (!txId) {
      return NextResponse.json({ error: "txId is required" }, { status: 400 });
    }

    if (!otp || String(otp).trim().length < 4) {
      return NextResponse.json({ error: "Неверный код 2FA. Введите минимум 4 цифры." }, { status: 400 });
    }

    const tx = await BankDatabase.confirm2FATransfer(txId);
    return NextResponse.json({ success: true, transaction: tx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
