import { getStoredAuthTokens, setStoredAuthTokens, isTokenExpiringSoon } from '../api/auth/authStorage';
import { AuthApiService } from '../api/services/authService';

const REFRESH_BUFFER_MINUTES = 5; // Start trying to refresh 5 minutes before expiry
export const MIN_REFRESH_INTERVAL_MS = 60000; // Minimum 1 minute between refresh attempts

export class TokenRefreshService {
  private static instance: TokenRefreshService;
  private refreshInterval: NodeJS.Timeout | null = null;
  private authService = new AuthApiService();
  
  private constructor() {
    // Private constructor to enforce singleton
  }
  
  public static getInstance(): TokenRefreshService {
    if (!TokenRefreshService.instance) {
      TokenRefreshService.instance = new TokenRefreshService();
    }
    return TokenRefreshService.instance;
  }
  
  public startRefreshCycle(): void {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Check every minute if token needs refresh
    this.refreshInterval = setInterval(async () => {
      if (this.shouldRefresh()) {
        await this.refreshToken();
      }
    }, 60000); // Check every minute
  }
  
  public stopRefreshCycle(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
    private shouldRefresh(): boolean {
    const tokens = getStoredAuthTokens();
    if (!tokens?.accessToken || !tokens?.tokenExpiry) return false;

    // Don't refresh if we're within the minimum refresh interval
    const timeSinceLogin = Date.now() - tokens.expiresIn * 1000; // Convert expiresIn to milliseconds
    if (timeSinceLogin < MIN_REFRESH_INTERVAL_MS) {
      console.log('Token was recently obtained, skipping refresh');
      return false;
    }

    return isTokenExpiringSoon(REFRESH_BUFFER_MINUTES * 60);
  }
  
  public async refreshToken(): Promise<boolean> {
    try {
      const tokens = getStoredAuthTokens();
      if (!tokens?.refreshToken) return false;
      
      console.log('TokenRefreshService: Proactively refreshing token...');
      const newTokens = await this.authService.refreshToken(tokens.refreshToken);
      
      setStoredAuthTokens({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        sessionId: tokens.sessionId
      });
      
      console.log('TokenRefreshService: Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('TokenRefreshService: Force refresh failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const tokenRefreshService = TokenRefreshService.getInstance();