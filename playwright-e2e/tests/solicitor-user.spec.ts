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
    expect(user.id).toBeTruthy();
    const userId = user.id as string;

    const initial = await idamUtils.getUserInfo({
      bearerToken,
      email: user.email,
    });

    const password = resolveSolicitorPassword();
    const updatedSurname = `${user.surname}-updated`;

    const updated = await idamUtils.updateUser({
      bearerToken,
      id: userId,
      password,
      user: {
        email: user.email,
        forename: user.forename,
        surname: updatedSurname,
        roleNames: user.roleNames,
      },
    });

    const refreshed = await idamUtils.getUserInfo({
      bearerToken,
      id: userId,
    });

    await testInfo.attach("solicitor-user", {
      body: JSON.stringify(
        { email: user.email, password, roles: user.roleNames },
        null,
        2
      ),
      contentType: "application/json",
    });

    expect(initial.email).toBe(user.email);
    expect(initial.roleNames).toEqual(
      expect.arrayContaining([...SOLICITOR_ROLE_NAMES])
    );
    expect(updated.surname).toBe(updatedSurname);
    expect(refreshed.surname).toBe(updatedSurname);
  });

  test("verifies password change by authenticating with new credentials", async ({
    professionalUserUtils,
    idamUtils,
  }, testInfo) => {
    const bearerToken = await resolveBearerToken(idamUtils);
    const clientId = requireEnvVar("CLIENT_ID");
    const clientSecret = requireEnvVar("IDAM_SECRET");

    const user = await professionalUserUtils.createSolicitorUser({
      bearerToken,
    });

    const userId = user.id as string;
    const newPassword = resolveSolicitorPassword();

    await idamUtils.updateUser({
      bearerToken,
      id: userId,
      password: newPassword,
      user: {
        email: user.email,
        forename: user.forename,
        surname: user.surname,
        roleNames: user.roleNames,
      },
    });

    // Verify the password works by authenticating
    const loginToken = await idamUtils.generateIdamToken({
      grantType: "password",
      clientId,
      clientSecret,
      username: user.email,
      password: newPassword,
      scope: "openid profile roles",
    });

    expect(loginToken).toBeTruthy();
    expect(loginToken).toMatch(/^[A-Za-z0-9._-]+$/);

    await testInfo.attach("password-verification", {
      body: JSON.stringify(
        { email: user.email, passwordVerified: true },
        null,
        2
      ),
      contentType: "application/json",
    });
  });
});
