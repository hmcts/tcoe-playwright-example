import type { IdamUtils } from "@hmcts/playwright-common";
import { expect, test } from "../fixtures";
import {
  CASEWORKER_DIVORCE_ROLE_NAMES,
  DEFAULT_CASEWORKER_DIVORCE_PASSWORD,
  requireEnvVar,
} from "../utils";

const resolveCaseworkerPassword = () =>
  process.env.IDAM_CASEWORKER_DIVORCE_PASSWORD?.trim() ||
  DEFAULT_CASEWORKER_DIVORCE_PASSWORD;

const resolveBearerToken = async (idamUtils: IdamUtils) => {
  const existing = process.env.CREATE_USER_BEARER_TOKEN?.trim();
  if (existing) {
    return existing;
  }
  const clientId = requireEnvVar("CLIENT_ID");
  const clientSecret = requireEnvVar("IDAM_SECRET");
  return idamUtils.generateIdamToken({
    grantType: "client_credentials",
    clientId,
    clientSecret,
    scope: "profile roles",
  });
};

test.describe("Caseworker divorce user provisioning @caseworker @api", () => {
  test(
    "creates and verifies a caseworker divorce account via IDAM",
    async ({ professionalUserUtils, idamUtils }, testInfo) => {
      const bearerToken = await resolveBearerToken(idamUtils);

      const user = await professionalUserUtils.createCaseworkerDivorceUser({
        bearerToken,
      });

      expect(user.email).toContain("caseworker_divorce");
      expect(user.roleNames).toEqual(
        expect.arrayContaining([...CASEWORKER_DIVORCE_ROLE_NAMES])
      );

      const fetched = await idamUtils.getUserInfo({
        bearerToken,
        email: user.email,
      });

      const password = resolveCaseworkerPassword();

      console.log(
        `[CASEWORKER_DIVORCE_USER] email=${user.email} password=${password} roles=${user.roleNames.join(
          ","
        )}`
      );

      await testInfo.attach("caseworker-divorce-user", {
        body: JSON.stringify(
          { email: user.email, password, roles: user.roleNames },
          null,
          2
        ),
        contentType: "application/json",
      });

      expect(fetched.email).toBe(user.email);
      expect(fetched.roleNames).toEqual(
        expect.arrayContaining([...CASEWORKER_DIVORCE_ROLE_NAMES])
      );
    }
  );
});
