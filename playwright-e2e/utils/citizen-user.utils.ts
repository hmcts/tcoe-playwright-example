import { IdamUtils } from "@hmcts/playwright-common";
import { v4 as uuidv4 } from "uuid";

type UserInfo = {
  email: string;
  password: string;
  forename: string;
  surname: string;
  id?: string;
  sessionFile?: string;
};

export class CitizenUserUtils {
  constructor(private idamUtils: IdamUtils) {}

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
}
