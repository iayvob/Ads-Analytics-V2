/**
 * URL utility functions for handling URLs in serverless environments
 * 
 * These functions help to ensure that URLs are properly constructed regardless of
 * the deployment environment (local, Vercel, or other platforms).
 */
import { env } from "./config"

/**
 * Gets the base URL for the application, suitable for Vercel and other environments
 * 
 * This function prioritizes the APP_URL environment variable, but falls back to
 * dynamically determining the URL based on request headers if possible
 * 
 * @param requestHeaders Optional headers from the request to extract host information
 * @returns The base URL for the application (e.g., https://your-app.vercel.app)
 */
export function getBaseUrl(requestHeaders?: Headers): string {
  // Always use the configured APP_URL if available
  if (env.APP_URL) {
    return env.APP_URL.replace(/\/$/, '') // Remove trailing slash if present
  }

  // Fallback for Vercel: use the x-forwarded-host and x-forwarded-proto headers
  if (requestHeaders) {
    const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')
    const proto = requestHeaders.get('x-forwarded-proto')?.split(',')[0] || 'https'
    
    if (host) {
      return `${proto}://${host}`
    }
  }

  // Last resort fallback (should not typically be reached)
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // If all else fails, return APP_URL (which might be undefined in this case)
  return env.APP_URL || ''
}

/**
 * Creates a full URL by joining the base URL with a path
 * 
 * @param path The path to append to the base URL
 * @param requestHeaders Optional headers from the request
 * @returns A complete URL
 */
export function createUrl(path: string, requestHeaders?: Headers): string {
  const baseUrl = getBaseUrl(requestHeaders)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

/**
 * Normalizes a URL by removing duplicate slashes in the path portion
 * 
 * @param url The URL to normalize
 * @returns A normalized URL with no duplicate slashes in the path
 */
export function normalizeUrl(url: string): string {
  return url.replace(/([^:]\/)\/+/g, '$1')
}
