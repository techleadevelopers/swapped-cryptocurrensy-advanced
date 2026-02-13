import { z } from 'zod';
import 'dotenv/config';

const EnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  RPC_URL: z.string().url(),
  HOT_WALLET_KEY: z.string().min(10),
  TOKEN_ADDRESS: z.string().min(10),
  TOKEN_DECIMALS: z.coerce.number().int().positive().default(8),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  WEBHOOK_SECRET: z.string().optional(),
  KMS_SIGNER_URL: z.string().optional(), // opcional para uso futuro
  PRICE_TTL_SEC: z.coerce.number().positive().default(60 * 5),
  RATE_LOCK_SEC: z.coerce.number().positive().default(600)
});

const env = EnvSchema.parse(process.env);

export const config = {
  rpcUrl: env.RPC_URL,
  hotWalletKey: env.HOT_WALLET_KEY,
  tokenAddress: env.TOKEN_ADDRESS,
  tokenDecimals: env.TOKEN_DECIMALS,
  allowedOrigins: env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean),
  webhookSecret: env.WEBHOOK_SECRET,
  kmsSignerUrl: env.KMS_SIGNER_URL,
  priceTtlSec: env.PRICE_TTL_SEC,
  rateLockSec: env.RATE_LOCK_SEC,
};
