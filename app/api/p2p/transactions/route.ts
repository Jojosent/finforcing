import { NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function GET() {
  try {
    const transactions = await BankDatabase.getTransactions(50);
    return NextResponse.json({ transactions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
