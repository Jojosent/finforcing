import { NextRequest, NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (userId) {
      await BankDatabase.updateActivity(userId, false);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
