import { NextResponse } from "next/server";
import { BENCHMARK_MODELS, TOP_SHAP_FEATURES } from "@/lib/ml/constants";

export async function GET() {
  return NextResponse.json({
    models: BENCHMARK_MODELS,
    topShapFeatures: TOP_SHAP_FEATURES,
    champion: "LightGBM",
    trainingDatasetSize: 25000,
    fraudRatePct: 2.87,
    status: "Production Ready"
  });
}
