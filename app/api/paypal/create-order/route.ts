import { NextRequest } from "next/server";
import type { Tier } from "../../../../lib/types";
import { createPayPalOrder } from "../../../../lib/paypal";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tier = body.tier as Tier;

    if (tier !== "basic" && tier !== "pro") {
      return Response.json({ ok: false, error: "Invalid report tier" }, { status: 400 });
    }

    const order = await createPayPalOrder(tier);

    return Response.json({
      ok: true,
      id: order.id
    });
  } catch (error) {
    console.error("PAYPAL_CREATE_ORDER_ERROR", error);
    return Response.json({
      ok: false,
      error: error instanceof Error ? error.message : "PayPal order creation failed"
    }, { status: 500 });
  }
}
