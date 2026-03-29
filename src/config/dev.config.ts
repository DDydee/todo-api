import { z } from 'zod';

export const configSchema = z.object({
  PORT: z.coerce.number().default(3000),

  POSTGRES_HOST: z.string(),
  POSTGRES_PORT: z.coerce.number(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  POSTGRES_SCHEMA: z.string().optional(),
  POSTGRES_URL: z.string().optional(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_URL: z.string(),
  JWT_KEY: z.string(),
  JWT_REFRESH_KEY: z.string(),
});

export type Env = z.infer<typeof configSchema>;
