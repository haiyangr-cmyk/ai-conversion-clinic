export type Tier = "basic" | "pro";

export type AuditInput = {
  url: string;
  product: string;
  audience: string;
  problem: string;
  pageCopy?: string;
  email?: string;
  paypalEmail?: string;
  paypalTransactionId?: string;
  paypalOrderId?: string;
  paymentToken?: string;
  accessCode?: string;
  tier: Tier;
  conversionGoal?: string;
};

export type GenerateResponse = {
  ok: boolean;
  report?: string;
  reportV2?: unknown;
  error?: string;
  demo?: boolean;
};
