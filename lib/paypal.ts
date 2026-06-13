import type { Tier } from "./types";

const PAYPAL_API_BASE = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com"
} as const;

export function getPayPalBaseUrl() {
  const env = process.env.PAYPAL_ENV === "sandbox" ? "sandbox" : "live";
  return PAYPAL_API_BASE[env];
}

export function expectedAmountForTier(tier: Tier) {
  if (tier === "basic") return "9.00";
  if (tier === "pro") return "29.00";
  throw new Error("Invalid report tier");
}

export function getPayPalCurrency() {
  return process.env.PAYPAL_CURRENCY || "USD";
}

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal API credentials");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal OAuth error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function createPayPalOrder(tier: Tier) {
  const accessToken = await getPayPalAccessToken();
  const amount = expectedAmountForTier(tier);
  const currency = getPayPalCurrency();

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `audit-${tier}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `ai-conversion-audit-${tier}`,
          description: tier === "pro" ? "AI Conversion Audit - Pro" : "AI Conversion Audit - Basic",
          amount: {
            currency_code: currency,
            value: amount
          }
        }
      ],
      application_context: {
        brand_name: "AI Conversion Clinic",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW"
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal create order error: ${response.status} ${text}`);
  }

  return response.json();
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `capture-${orderId}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayPal capture order error: ${response.status} ${text}`);
  }

  return response.json();
}

export function verifyCapturedOrder(order: any, tier: Tier) {
  const expectedAmount = expectedAmountForTier(tier);
  const expectedCurrency = getPayPalCurrency();

  if (order.status !== "COMPLETED") {
    throw new Error(`PayPal order is not completed. Current status: ${order.status}`);
  }

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];

  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("PayPal payment capture was not completed");
  }

  const paidAmount = capture.amount?.value;
  const paidCurrency = capture.amount?.currency_code;

  if (paidAmount !== expectedAmount || paidCurrency !== expectedCurrency) {
    throw new Error(`PayPal amount mismatch. Expected ${expectedCurrency} ${expectedAmount}, got ${paidCurrency} ${paidAmount}`);
  }

  return {
    captureId: capture.id,
    amount: paidAmount,
    currency: paidCurrency,
    status: capture.status
  };
}
