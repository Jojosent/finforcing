import { NextResponse } from "next/server";
import { BankDatabase } from "@/lib/firebase/db";

export async function GET() {
  try {
    const users = await BankDatabase.getUsers();
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
