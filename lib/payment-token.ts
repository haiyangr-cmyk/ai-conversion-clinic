import crypto from "crypto";
import type { Tier } from "./types";

type PaymentTokenPayload = {
  orderId: string;
  tier: Tier;
  amount: string;
  currency: string;
  captureId: string;
  exp: number;
};

function getSigningSecret() {
  const secret = process.env.PAYMENT_TOKEN_SECRET;

  if (secret) return secret;

  if (process.env.NODE_ENV === "development" && process.env.PAYPAL_CLIENT_SECRET) {
    return process.env.PAYPAL_CLIENT_SECRET;
  }

  throw new Error("Missing PAYMENT_TOKEN_SECRET");
}

function signPayload(payloadBase64: string) {
  return crypto.createHmac("sha256", getSigningSecret()).update(payloadBase64).digest("base64url");
}

export function createPaymentToken(payload: Omit<PaymentTokenPayload, "exp">) {
  const fullPayload: PaymentTokenPayload = {
    ...payload,
    exp: Date.now() + 20 * 60 * 1000
  };

  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyPaymentToken(token: string, tier: Tier) {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    throw new Error("Invalid payment token");
  }

  const expectedSignature = signPayload(payloadBase64);
  const actualSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    actualSignatureBuffer.length !== expectedSignatureBuffer.length
    || !crypto.timingSafeEqual(actualSignatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error("Invalid payment token signature");
  }

  const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as PaymentTokenPayload;

  if (payload.exp < Date.now()) {
    throw new Error("Payment token expired. Please complete checkout again.");
  }

  if (payload.tier !== tier) {
    throw new Error("Payment token tier does not match selected report tier");
  }

  return payload;
}
