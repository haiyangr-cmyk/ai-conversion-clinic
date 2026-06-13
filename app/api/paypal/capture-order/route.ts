import { NextRequest } from "next/server";
import type { Tier } from "../../../../lib/types";
import { capturePayPalOrder, verifyCapturedOrder } from "../../../../lib/paypal";
import { createPaymentToken } from "../../../../lib/payment-token";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body.orderId || "");
    const tier = body.tier as Tier;

    if (!orderId) {
      return Response.json({ ok: false, error: "Missing PayPal order ID" }, { status: 400 });
    }

    if (tier !== "basic" && tier !== "pro") {
      return Response.json({ ok: false, error: "Invalid report tier" }, { status: 400 });
    }

    const capturedOrder = await capturePayPalOrder(orderId);
    const verified = verifyCapturedOrder(capturedOrder, tier);

    const paymentToken = createPaymentToken({
      orderId,
      tier,
      amount: verified.amount,
      currency: verified.currency,
      captureId: verified.captureId
    });

    return Response.json({
      ok: true,
      orderId,
      captureId: verified.captureId,
      paymentToken
    });
  } catch (error) {
    console.error("PAYPAL_CAPTURE_ORDER_ERROR", error);
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "PayPal payment capture failed"
    }, { status: 500 });
  }
}
