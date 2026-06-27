import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    message:
      "PhonePe callback received. Call /api/checkout/phonepe/status with merchantTransactionId to sync final state.",
    callbackPayload: body,
  });
}
