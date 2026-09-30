import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

// POST: Create a test payment request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requesterId, payerId, amount, memoText } = body;

    if (!requesterId || !payerId || !amount) {
      return NextResponse.json({ error: "Missing required request fields." }, { status: 400 });
    }

    const txRecord = await BankDatabase.createPaymentRequest({
      requesterId,
      payerId,
      amount: Number(amount),
      memoText
    });

    return NextResponse.json({ success: true, transaction: txRecord });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Fulfill or decline payment request
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, payerId, action } = body;

    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    if (action === "DECLINE") {
      const tx = await BankDatabase.declinePaymentRequest(requestId);
      return NextResponse.json({ success: true, transaction: tx });
    } else {
      if (!payerId) {
        return NextResponse.json({ error: "payerId is required to fulfill request" }, { status: 400 });
      }
      const tx = await BankDatabase.fulfillPaymentRequest({ requestId, payerId });
      return NextResponse.json({ success: true, transaction: tx });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
