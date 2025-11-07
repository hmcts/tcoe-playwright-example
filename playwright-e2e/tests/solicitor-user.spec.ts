import type { IdamUtils } from "@hmcts/playwright-common";
import { expect, test } from "../fixtures";
import {
  DEFAULT_SOLICITOR_PASSWORD,
  SOLICITOR_ROLE_NAMES,
  requireEnvVar,
} from "../utils";

const resolveSolicitorPassword = () =>
  process.env.IDAM_SOLICITOR_USER_PASSWORD?.trim() ||
  DEFAULT_SOLICITOR_PASSWORD;

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

test.describe("Solicitor user provisioning @solicitor @api", () => {
  test("creates and verifies a solicitor account via IDAM", async ({
    professionalUserUtils,
    idamUtils,
  }, testInfo) => {
    const bearerToken = await resolveBearerToken(idamUtils);

    const user = await professionalUserUtils.createSolicitorUser({
      bearerToken,
    });

    expect(user.email).toContain("solicitor");
    expect(user.roleNames).toEqual(
      expect.arrayContaining([...SOLICITOR_ROLE_NAMES])
    );

    const fetched = await idamUtils.getUserInfo({
      bearerToken,
      email: user.email,
    });

    const password = resolveSolicitorPassword();

    console.log(
      `[SOLICITOR_USER] email=${user.email} password=${password} roles=${user.roleNames.join(
        ","
      )}`
    );

    await testInfo.attach("solicitor-user", {
      body: JSON.stringify(
        { email: user.email, password, roles: user.roleNames },
        null,
        2
      ),
      contentType: "application/json",
    });

    expect(fetched.email).toBe(user.email);
    expect(fetched.roleNames).toEqual(
      expect.arrayContaining([...SOLICITOR_ROLE_NAMES])
    );
  });
});
