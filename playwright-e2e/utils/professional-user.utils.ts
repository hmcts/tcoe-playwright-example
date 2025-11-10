import { IdamUtils } from "@hmcts/playwright-common";
import { v4 as uuidv4 } from "uuid";
import { requireEnvVar } from "./config.utils";

export const DEFAULT_SOLICITOR_PASSWORD = "Password12!";
export const DEFAULT_CASEWORKER_DIVORCE_PASSWORD = "Password12!";

export const SOLICITOR_ROLE_NAMES = [
  "caseworker-privatelaw-solicitor",
  "caseworker-privatelaw",
  "pui-case-manager",
  "pui-organisation-manager",
] as const;

export const CASEWORKER_DIVORCE_ROLE_NAMES = [
  "caseworker",
  "caseworker-divorce",
  "caseworker-divorce-judge",
  "caseworker-divorce-courtadmin-la",
  "caseworker-divorce-superuser"
] as const;

export type ProfessionalUserInfo = {
  id?: string;
  email: string;
  password: string;
  forename: string;
  surname: string;
  roleNames: string[];
};

type CreateProfessionalUserOptions = {
  bearerToken?: string;
  password?: string;
  roleNames: readonly string[];
  emailPrefix: string;
};

type CreateTypeSpecificOptions = {
  bearerToken?: string;
};

export class ProfessionalUserUtils {
  constructor(private readonly idamUtils: IdamUtils) {}

  public async createSolicitorUser(
    options: CreateTypeSpecificOptions = {}
  ): Promise<ProfessionalUserInfo> {
    const password =
      process.env.IDAM_SOLICITOR_USER_PASSWORD?.trim() ||
      DEFAULT_SOLICITOR_PASSWORD;
    return this.createUser({
      ...options,
      password,
      roleNames: SOLICITOR_ROLE_NAMES,
      emailPrefix: "solicitor",
    });
  }

  public async createCaseworkerDivorceUser(
    options: CreateTypeSpecificOptions = {}
  ): Promise<ProfessionalUserInfo> {
    const password =
      process.env.IDAM_CASEWORKER_DIVORCE_PASSWORD?.trim() ||
      DEFAULT_CASEWORKER_DIVORCE_PASSWORD;
    return this.createUser({
      ...options,
      password,
      roleNames: CASEWORKER_DIVORCE_ROLE_NAMES,
      emailPrefix: "caseworker_divorce",
    });
  }

  public async createUser({
    bearerToken,
    password,
    roleNames,
    emailPrefix,
  }: CreateProfessionalUserOptions): Promise<ProfessionalUserInfo> {
    const token =
      bearerToken ??
      process.env.CREATE_USER_BEARER_TOKEN?.trim() ??
      requireEnvVar("CREATE_USER_BEARER_TOKEN");
    const secret = password ?? DEFAULT_SOLICITOR_PASSWORD;
    const uniqueId = uuidv4();
    const [firstPart, secondPart] = uniqueId.split("-");

    const email = `TEST_PRL_USER_${emailPrefix}.${uniqueId}@test.local`;
    const forename = `${emailPrefix}_fn_${firstPart}`;
    const surname = `${emailPrefix}_sn_${secondPart}`;

    const created = await this.idamUtils.createUser({
      bearerToken: token,
      password: secret,
      user: {
        email,
        forename,
        surname,
        roleNames: [...roleNames],
      },
    });

    return {
      id: created.id,
      email: created.email,
      password: secret,
      forename,
      surname,
      roleNames: [...roleNames],
    };
  }
}
