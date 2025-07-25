import { Page } from "@playwright/test";
import { IdamUtils, IdamPage, SessionUtils } from "@hmcts/playwright-common";
import { v4 as uuidv4 } from "uuid";
import { Config } from "../utils/config.utils";
import { CookieUtils } from "./cookie.utils";

type UserInfo = {
  email: string;
  password: string;
  forename: string;
  surname: string;
  id?: string;
  sessionFile?: string;
};

export class CitizenUserUtils {
  private idamPage: IdamPage;
  constructor(
    private page: Page,
    private idamUtils: IdamUtils,
    private config: Config,
    private cookieUtils: CookieUtils,
  ) {
    this.idamPage = new IdamPage(this.page);
  }

  public async createUser(): Promise<UserInfo> {
    const token = process.env.CREATE_USER_BEARER_TOKEN as string;
    const password = process.env.IDAM_CITIZEN_USER_PASSWORD as string;
    const uniqueId = uuidv4();

    const email = `TEST_PRL_USER_citizen.${uniqueId}@test.local`;
    const forename = "fn_" + uniqueId.split("-")[0];
    const surname = "sn_" + uniqueId.split("-")[1];

    const user = await this.idamUtils.createUser({
      bearerToken: token,
      password,
      user: {
        email,
        forename,
        surname,
        roleNames: ["citizen"],
      },
    });

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      forename,
      surname,
    };
  }

  public async log(user): Promise<string> {
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
