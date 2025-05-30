import type { User, AuthProvider } from "@prisma/client"

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

// Auth types
export interface AuthSession {
  userId: string
  state?: string
  codeVerifier?: string
  createdAt: number
  facebook?: {
    accessToken: string
    userId: string
    name: string
    expiresAt: number
    email?: string
    businesses?: any[]
    adAccounts?: any[]
    configId?: string
  }
  instagram?: {
    accessToken: string
    userId: string
    username: string
    expiresAt: number
  }
  twitter?: {
    accessToken: string
    refreshToken?: string
    userId: string
    username: string
    expiresAt: number
  }
}

export interface ProviderTokens {
  accessToken: string
  refreshToken?: string
  expiresAt: Date
}

export interface UserWithProviders extends User {
  authProviders: AuthProvider[]
}

// Provider-specific data types
export interface FacebookUserData {
  id: string
  name: string
  email?: string
}

export interface FacebookBusinessData {
  businesses: any[]
  adAccounts: any[]
  primaryAdAccountId?: string
}

export interface InstagramUserData {
  id: string
  username: string
}

export interface TwitterUserData {
  id: string
  username: string
}

// Validation schemas
export interface CreateUserInput {
  email?: string
  username?: string
}

export interface UpdateUserInput {
  username?: string
  email?: string
}

export interface AuthProviderInput {
  provider: "facebook" | "instagram" | "twitter"
  providerId: string
  username?: string
  email?: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  advertisingAccountId?: string
  businessAccounts?: any
  adAccounts?: any
  configId?: string
  profilePictureUrl?: string
  businessAccountId?: string
}
