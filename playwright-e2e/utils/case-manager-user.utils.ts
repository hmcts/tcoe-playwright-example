import { SessionUtils, IdamPage } from "@hmcts/playwright-common";
import { CookieUtils } from "./cookie.utils";
import { Config } from "../utils/config.utils";
import { Page } from "@playwright/test";

export class CaseManagerUserUtils {
  private idamPage: IdamPage;

  constructor(
    private page: Page,
    private cookieUtils: CookieUtils,
    private config: Config
  ) {
    this.idamPage = new IdamPage(this.page);
  }

  public async useLoggedInSession(): Promise<string> {
    const user = this.config.users.caseManager;
    if (SessionUtils.isSessionValid(user.sessionFile, user.cookieName!)) {
      return user.sessionFile!;
    } else {
      await this.page.goto(this.config.urls.manageCaseBaseUrl);
      await this.idamPage.login(user);
      await this.cookieUtils.addManageCasesAnalyticsCookie(user.sessionFile!);
      return user.sessionFile!;
    }
  }
}