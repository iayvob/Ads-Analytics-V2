import { logger } from "../logger"
import { AuthError } from "../errors"

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface MockDataGenerator<T> {
  generateMockData(): T
}

export abstract class BaseApiClient {
  protected static async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    errorMessage = "API request failed",
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        logger.error(`API request failed: ${url}`, {
          status: response.status,
          error: errorData,
        })
        throw new AuthError(`${errorMessage}: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      logger.error(`Request error: ${url}`, { error })
      if (error instanceof AuthError) throw error
      throw new AuthError(errorMessage)
    }
  }

  protected static handleApiError(error: unknown, context: string): never {
    logger.error(`${context} failed`, { error })
    if (error instanceof AuthError) throw error
    throw new AuthError(`Failed to ${context.toLowerCase()}`)
  }
}
