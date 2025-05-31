import { prisma } from "./prisma"
import { DatabaseError } from "./errors"
import { logger } from "./logger"
import { validateAndSanitizeUser } from "./validation"
import type { User, AuthProvider } from "@prisma/client"
import type { CreateUserInput, UpdateUserInput, AuthProviderInput, UserWithProviders } from "./types"
import { APP_CONFIG } from "./config" // Declare the APP_CONFIG variable

export class UserService {
  static async findOrCreateUserByEmail(email: string, userData?: CreateUserInput): Promise<User> {
    try {
      const sanitizedData = userData ? validateAndSanitizeUser(userData) : {} as Partial<CreateUserInput>

      let user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            ...(sanitizedData.username ? { username: sanitizedData.username } : {}),
          },
        })
        logger.info("User created", { userId: user.id, email })
      }

      return user
    } catch (error) {
      logger.error("Failed to find or create user", { error, email })
      throw new DatabaseError("Failed to create user account")
    }
  }

  static async findUserByProvider(provider: string, providerId: string): Promise<UserWithProviders | null> {
    try {
      const authProvider = await prisma.authProvider.findUnique({
        where: {
          provider_providerId: { provider, providerId },
        },
        include: {
          user: {
            include: {
              authProviders: true,
            },
          },
        },
      })

      return authProvider?.user || null
    } catch (error) {
      logger.error("Failed to find user by provider", { error, provider, providerId })
      throw new DatabaseError("Failed to find user")
    }
  }

  static async upsertAuthProvider(userId: string, providerData: AuthProviderInput): Promise<AuthProvider> {
    try {
      const result = await prisma.authProvider.upsert({
        where: {
          provider_providerId: {
            provider: providerData.provider,
            providerId: providerData.providerId,
          },
        },
        update: {
          accessToken: providerData.accessToken,
          refreshToken: providerData.refreshToken,
          expiresAt: providerData.expiresAt,
          username: providerData.username,
          email: providerData.email,
          advertisingAccountId: providerData.advertisingAccountId,
          businessAccounts: providerData.businessAccounts,
          adAccounts: providerData.adAccounts,
          configId: providerData.configId,
          updatedAt: new Date(),
        },
        create: {
          userId,
          ...providerData,
        },
      })

      logger.info("Auth provider updated", {
        userId,
        provider: providerData.provider,
        providerId: providerData.providerId,
      })

      return result
    } catch (error) {
      logger.error("Failed to upsert auth provider", { error, userId, provider: providerData.provider })
      throw new DatabaseError("Failed to save authentication data")
    }
  }

  static async getUserWithProviders(userId: string): Promise<UserWithProviders | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        include: {
          authProviders: true,
        },
      })
    } catch (error) {
      logger.error("Failed to get user with providers", { error, userId })
      throw new DatabaseError("Failed to retrieve user data")
    }
  }

  static async removeAuthProvider(provider: string, providerId: string): Promise<void> {
    try {
      await prisma.authProvider.delete({
        where: {
          provider_providerId: { provider, providerId },
        },
      })

      logger.info("Auth provider removed", { provider, providerId })
    } catch (error) {
      logger.error("Failed to remove auth provider", { error, provider, providerId })
      throw new DatabaseError("Failed to remove authentication")
    }
  }

  static async getActiveProviders(userId: string): Promise<AuthProvider[]> {
    try {
      const now = new Date()
      return await prisma.authProvider.findMany({
        where: {
          userId,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      })
    } catch (error) {
      logger.error("Failed to get active providers", { error, userId })
      throw new DatabaseError("Failed to retrieve authentication data")
    }
  }

  static async updateUser(userId: string, data: UpdateUserInput): Promise<User> {
    try {
      const sanitizedData = validateAndSanitizeUser(data)

      const user = await prisma.user.update({
        where: { id: userId },
        data: sanitizedData,
      })

      logger.info("User updated", { userId })
      return user
    } catch (error) {
      logger.error("Failed to update user", { error, userId })
      throw new DatabaseError("Failed to update user profile")
    }
  }

  static async getUserStats() {
    try {
      const [totalUsers, providerStats] = await Promise.all([
        prisma.user.count(),
        prisma.authProvider.groupBy({
          by: ["provider"],
          _count: { provider: true },
        }),
      ])

      return {
        totalUsers,
        providerStats: providerStats.reduce(
          (acc, stat) => {
            acc[stat.provider] = stat._count.provider
            return acc
          },
          {} as Record<string, number>,
        ),
      }
    } catch (error) {
      logger.error("Failed to get user stats", { error })
      throw new DatabaseError("Failed to retrieve statistics")
    }
  }

  static isTokenExpired(provider: AuthProvider): boolean {
    if (!provider.expiresAt) return false
    return new Date() >= provider.expiresAt
  }

  static needsTokenRefresh(provider: AuthProvider): boolean {
    if (!provider.expiresAt) return false
    const threshold = new Date(Date.now() + APP_CONFIG.TOKEN_REFRESH_THRESHOLD)
    return provider.expiresAt <= threshold
  }
}
