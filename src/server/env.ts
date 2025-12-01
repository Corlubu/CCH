import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: z.string().optional(),
  BASE_URL_OTHER_PORT: z.string().optional(),
  ADMIN_PASSWORD: z.string(),
  JWT_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z
    .string()
    .default("10")
    .transform((val) => parseInt(val, 10)),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  OPENROUTER_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

function getEnv(): Env {
  if (cachedEnv === null) {
    try {
      cachedEnv = envSchema.parse(process.env);
    } catch (error) {
      console.error("Environment validation failed:");
      console.error(error);
      throw error;
    }
  }
  return cachedEnv;
}

// Create a Proxy that lazily validates and caches the environment variables
export const env = new Proxy({} as Env, {
  get(_target, prop: string | symbol) {
    if (typeof prop === "symbol") {
      return undefined;
    }
    const validated = getEnv();
    return validated[prop as keyof Env];
  },
  has(_target, prop) {
    const validated = getEnv();
    return prop in validated;
  },
  ownKeys(_target) {
    const validated = getEnv();
    return Reflect.ownKeys(validated);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const validated = getEnv();
    return Reflect.getOwnPropertyDescriptor(validated, prop);
  },
});
