import { Page } from '@playwright/test';
import { CookieUtils } from './cookie.utils';
import { SessionUtils } from '@hmcts/playwright-common';
import { config } from './config.utils';
import { IdamPage } from "@hmcts/playwright-common";

type UserRole = 'citizen' | 'caseManager' | 'judge';

export interface User {
    username: string;  
    password: string;
    sessionFile: string;
    cookieName?: string;
  }

export class LoginUtils {
  constructor(private page: Page, private cookieUtils: CookieUtils) {}

  async loggedInAs(user: User, role: UserRole) {
    const baseUrl =
        role === 'citizen' ? config.urls.citizenUrl : config.urls.manageCaseBaseUrl;
    
    const sessionValid = SessionUtils.isSessionValid(user.sessionFile, user.cookieName!);
    console.log(`Checking session for ${user.username}, valid? ${sessionValid}`);
    
    if (sessionValid) {
        console.log("Session valid - skipping login");
        return;
    }

    const idamPage = new IdamPage(this.page);
    await this.page.goto(baseUrl);
    await idamPage.login(user);
    await this.cookieUtils.addAnalyticsCookie(user);
  }
}
