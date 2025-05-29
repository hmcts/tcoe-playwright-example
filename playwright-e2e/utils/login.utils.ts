import { Page } from '@playwright/test';
import { CookieUtils } from './cookie.utils';
import { IdamPage } from '@hmcts/playwright-common';
import { config } from './config.utils';

export type UserRole = 'citizen' | 'caseManager' | 'judge';
export interface User {
  username: string;
  password: string;
  sessionFile: string;
  cookieName?: string;
}

export class LoginUtils {
  constructor(
    private page: Page, 
    private cookieUtils: CookieUtils
  ) {}

  async performLogin(user: User, role: UserRole): Promise<void> {
    const baseUrl = this.getBaseUrlForRole(role);
    
    try {
      console.log(`Logging in user: ${user.username}`);
      
      await this.page.goto(baseUrl);
      const idamPage = new IdamPage(this.page);
      await idamPage.login(user);
      await this.cookieUtils.addAnalyticsCookie(user);
      
      console.log(`Session saved for ${user.username} at ${user.sessionFile}`);
    } catch (error) {
      console.error(`Login failed for ${user.username}:`, error);
      throw new Error(`Failed to login user ${user.username}: ${error}`);
    }
  }

  private getBaseUrlForRole(role: UserRole): string {
    switch (role) {
      case 'citizen':
        return config.urls.citizenUrl;
      case 'caseManager':
      case 'judge':
        return config.urls.manageCaseBaseUrl;
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}