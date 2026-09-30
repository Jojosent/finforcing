import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const csvPath = path.resolve(process.cwd(), "ml_pipeline/data/sample_batch_1000.csv");
    if (fs.existsSync(csvPath)) {
      const csvData = fs.readFileSync(csvPath, "utf-8");
      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="sample_batch_1000.csv"'
        }
      });
    }

    return NextResponse.json({ error: "Batch sample file not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
