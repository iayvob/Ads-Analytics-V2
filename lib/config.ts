import { z } from "zod"

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url(),
  FACEBOOK_APP_ID: z.string().min(1),
  FACEBOOK_APP_SECRET: z.string().min(1),
  FACEBOOK_BUSINESS_CONFIG_ID: z.string().optional(),
  INSTAGRAM_APP_ID: z.string().min(1),
  INSTAGRAM_APP_SECRET: z.string().min(1),
  TWITTER_CLIENT_ID: z.string().min(1),
  TWITTER_CLIENT_SECRET: z.string().min(1),
})

// Validate environment variables at startup
function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error("❌ Invalid environment variables:", error)
    process.exit(1)
  }
}

export const env = validateEnv()

// App configuration constants
export const APP_CONFIG = {
  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const

export const OAUTH_SCOPES = {
  FACEBOOK: [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_read_engagement",
    "pages_manage_ads",
    "pages_manage_metadata",
    "read_insights",
  ].join(","),
  INSTAGRAM: [
    "instagram_business_basic",
    "instagram_business_manage_messages",
    "instagram_business_manage_comments",
    "instagram_business_content_publish",
    "instagram_business_manage_insights",
  ].join(","),
  TWITTER: "tweet.read users.read like.read follows.read offline.access",
} as const