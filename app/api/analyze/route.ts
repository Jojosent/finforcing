import { NextRequest, NextResponse } from "next/server";
import { analyzeTransaction, TransactionInput } from "@/lib/ml/fraudDetector";

export async function POST(req: NextRequest) {
  try {
    const body: TransactionInput = await req.json();

    if (body.amount === undefined || body.hour === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: amount and hour" },
        { status: 400 }
      );
    }

    const result = analyzeTransaction(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to score transaction", details: error.message },
      { status: 500 }
    );
  }
}
