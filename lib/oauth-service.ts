import { env, OAUTH_SCOPES } from "./config"
import { logger } from "./logger"
import { AuthError } from "./errors"
import type { FacebookUserData, FacebookBusinessData, InstagramUserData, TwitterUserData } from "./types"

export class OAuthService {
  static async exchangeFacebookCode(code: string, redirectUri: string) {
    try {
      const response = await fetch("https://graph.facebook.com/v18.0/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.FACEBOOK_APP_ID,
          client_secret: env.FACEBOOK_APP_SECRET,
          redirect_uri: redirectUri,
          code,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error("Facebook token exchange failed", { error: errorData })
        throw new AuthError("Failed to authenticate with Facebook")
      }

      return await response.json()
    } catch (error) {
      logger.error("Facebook OAuth error", { error })
      throw new AuthError("Facebook authentication failed")
    }
  }

  static async getFacebookUserData(accessToken: string): Promise<FacebookUserData> {
    try {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email`)

      if (!response.ok) {
        throw new AuthError("Failed to fetch Facebook user data")
      }

      return await response.json()
    } catch (error) {
      logger.error("Failed to get Facebook user data", { error })
      throw new AuthError("Failed to retrieve user information")
    }
  }

  static async getFacebookBusinessData(accessToken: string): Promise<FacebookBusinessData> {
    try {
      const [businessResponse, adAccountsResponse] = await Promise.all([
        fetch(
          `https://graph.facebook.com/me/businesses?access_token=${accessToken}&fields=id,name,verification_status`,
        ),
        fetch(
          `https://graph.facebook.com/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status,business`,
        ),
      ])

      const businessData = businessResponse.ok ? await businessResponse.json() : { data: [] }
      const adAccountsData = adAccountsResponse.ok ? await adAccountsResponse.json() : { data: [] }

      const primaryAdAccountId = adAccountsData.data?.find(
        (account: any) => account.account_status === 1 || account.account_status === "ACTIVE",
      )?.id

      return {
        businesses: businessData.data || [],
        adAccounts: adAccountsData.data || [],
        primaryAdAccountId,
      }
    } catch (error) {
      logger.warn("Failed to get Facebook business data", { error })
      return { businesses: [], adAccounts: [] }
    }
  }

  static async exchangeInstagramCode(code: string, redirectUri: string) {
    try {
      const formData = new FormData();
      formData.append('client_id', env.INSTAGRAM_APP_ID);
      formData.append('client_secret', env.INSTAGRAM_APP_SECRET);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);

      const response = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error("Instagram token exchange failed", { error: errorData })
        throw new AuthError("Failed to authenticate with Instagram")
      }

      return await response.json()
    } catch (error) {
      logger.error("Instagram OAuth error", { error })
      throw new AuthError("Instagram authentication failed")
    }
  }

  static async getInstagramUserData(accessToken: string, IGid: string): Promise<InstagramUserData> {
    try {
      const url = new URL(`https://graph.instagram.com/v23.0/me`);
      url.searchParams.append('fields', 'id,username');
      url.searchParams.append('access_token', accessToken);

      console.log("Fetching Instagram user data from URL:", url.toString());
      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.text();
        logger.error("Instagram user data fetch failed", { error: err });
        throw new AuthError(`Failed to fetch Instagram user data: ${err}`);
      }

      const json = await res.json() as { id: string; username: string };
      return { id: json.id, username: json.username };
    } catch (err: any) {
      logger.error("getInstagramUserData error", { error: err });
      throw new AuthError("Failed to retrieve Instagram user information");
    }
  }



  static async exchangeTwitterCode(code: string, redirectUri: string, codeVerifier?: string) {
    try {
      const response = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${env.TWITTER_CLIENT_ID}:${env.TWITTER_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier!,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error("Twitter token exchange failed", { error: errorData })
        throw new AuthError("Failed to authenticate with Twitter")
      }

      return await response.json()
    } catch (error) {
      logger.error("Twitter OAuth error", { error })
      throw new AuthError("Twitter authentication failed")
    }
  }

  static async getTwitterUserData(accessToken: string): Promise<TwitterUserData> {
    try {
      const response = await fetch("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new AuthError("Failed to fetch Twitter user data")
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      logger.error("Failed to get Twitter user data", { error })
      throw new AuthError("Failed to retrieve user information")
    }
  }

  static buildFacebookAuthUrl(state: string, redirectUri: string): string {
    const authUrl = new URL("https://www.facebook.com/v18.0/dialog/oauth")
    authUrl.searchParams.set("client_id", env.FACEBOOK_APP_ID)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("scope", OAUTH_SCOPES.FACEBOOK)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("state", state)
    authUrl.searchParams.set("display", "popup")

    if (env.FACEBOOK_BUSINESS_CONFIG_ID) {
      authUrl.searchParams.set("config_id", env.FACEBOOK_BUSINESS_CONFIG_ID)
    }

    return authUrl.toString()
  }

  static buildInstagramAuthUrl(state: string, redirectUri: string): string {
    const authUrl = new URL("https://www.instagram.com/oauth/authorize");

    authUrl.searchParams.set("client_id", env.INSTAGRAM_APP_ID)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("scope", OAUTH_SCOPES.INSTAGRAM)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("state", state)

    return authUrl.toString()
  }

  static buildTwitterAuthUrl(
    state: string,
    redirectUri: string,
    codeChallenge: string
  ): string {
    // 1) Collapse any “//” in the path portion of the URI to a single “/”
    const normalizeRedirect = redirectUri.replace(/([^:]\/)\/+/g, '$1');
    console.log("redirect URI:", redirectUri);

    console.log("Normalized redirect URI:", normalizeRedirect);

    // 2) Define your params in a plain object
    const params: Record<string, string> = {
      client_id: env.TWITTER_CLIENT_ID,
      scope: OAUTH_SCOPES.TWITTER,       // e.g. "users.read tweet.read offline.access"
      response_type: 'code',
      redirect_uri: normalizeRedirect,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    // 3) Manually build the query string so that encodeURIComponent handles spaces as %20
    const queryString = Object.entries(params)
      .map(
        ([key, val]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
      )
      .join('&');

    return `https://twitter.com/i/oauth2/authorize?${queryString}`;
  }
}
