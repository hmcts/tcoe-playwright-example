import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

const initialCitizenBaseUrl = process.env.CITIZEN_FRONTEND_BASE_URL;
const initialExuiDefaultUrl = process.env.EXUI_DEFAULT_URL;

function createSessionFile(initialState: unknown) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "cookie-utils-"));
  const filePath = path.join(tempDir, "session.json");
  writeFileSync(filePath, JSON.stringify(initialState, null, 2));
  return { tempDir, filePath };
}

afterEach(() => {
  process.env.CITIZEN_FRONTEND_BASE_URL = initialCitizenBaseUrl;
  process.env.EXUI_DEFAULT_URL = initialExuiDefaultUrl;
  vi.resetModules();
});

describe("CookieUtils", () => {
  it("derives citizen cookie domain from URLs containing a path segment", async () => {
    const { tempDir, filePath } = createSessionFile({ cookies: [] });

    try {
      process.env.CITIZEN_FRONTEND_BASE_URL = "https://citizen.hmcts.net/app/";
      vi.resetModules();
      const { CookieUtils } = await import(
        "../../playwright-e2e/utils/cookie.utils.js"
      );

      const utils = new CookieUtils();
      await utils.addCitizenAnalyticsCookie(filePath);

      const state = JSON.parse(readFileSync(filePath, "utf-8"));
      const cookie = state.cookies.find(
        (entry: { name: string }) => entry.name === "prl-cookie-preferences"
      );

      expect(cookie).toBeDefined();
      expect(cookie.domain).toBe("citizen.hmcts.net");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("derives EXUI analytics cookie domain from URLs containing a path segment", async () => {
    const { tempDir, filePath } = createSessionFile({
      cookies: [{ name: "__userid__", value: "12345" }],
    });

    try {
      process.env.EXUI_DEFAULT_URL = "https://manage.hmcts.net/app/";
      vi.resetModules();
      const { CookieUtils } = await import(
        "../../playwright-e2e/utils/cookie.utils.js"
      );

      const utils = new CookieUtils();
      await utils.addManageCasesAnalyticsCookie(filePath);

      const state = JSON.parse(readFileSync(filePath, "utf-8"));
      const cookie = state.cookies.find(
        (entry: { name: string }) =>
          entry.name.startsWith("hmcts-exui-cookies-")
      );

      expect(cookie).toBeDefined();
      expect(cookie.domain).toBe("manage.hmcts.net");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
