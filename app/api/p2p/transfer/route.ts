import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      senderId,
      recipientId,
      amount,
      hour,
      minute = 0,
      memoText = "Перевод",
      isNewRecipient = false,
      isNewDevice = false,
      isForeignIp = false
    } = body;

    if (!senderId || !recipientId || !amount) {
      return NextResponse.json({ error: "Missing required transfer fields." }, { status: 400 });
    }

    const txRecord = await BankDatabase.executeTransfer({
      senderId,
      recipientId,
      amount: Number(amount),
      hour: Number(hour),
      minute: Number(minute),
      memoText,
      isNewRecipient,
      isNewDevice,
      isForeignIp
    });

    return NextResponse.json({ success: true, transaction: txRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
