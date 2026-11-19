import { readFileSync } from "node:fs";
import type { CcdCaseEventUtils } from "@hmcts/playwright-common";
import { expect, test } from "../../fixtures";

/**
 * Runs CcdCaseEventUtils against a real CCD data store (AAT by default; needs VPN).
 * Skipped (with the missing variable names in the reason) unless REQUIRED_ENV is set.
 *
 * Env:
 * - CCD_USER_USERNAME / CCD_USER_PASSWORD: user that can run CCD_CREATE_EVENT_ID
 * - CCD_CREATE_EVENT_ID: creation event (default solicitorCreate)
 * - CCD_CREATE_EVENT_DATA_FILE: optional JSON file with eventData for the creation event
 * - CCD_NEXT_EVENT_ID / CCD_NEXT_EVENT_DATA_FILE: optional event to fire on the new case
 * - CCD_DATA_STORE_URL, CCD_CASE_TYPE, CCD_S2S_MICROSERVICE, CLIENT_ID, IDAM_SECRET (see .env.example)
 */
const username = process.env.CCD_USER_USERNAME?.trim();
const password = process.env.CCD_USER_PASSWORD?.trim();
const createEventId = process.env.CCD_CREATE_EVENT_ID?.trim() || "solicitorCreate";
const nextEventId = process.env.CCD_NEXT_EVENT_ID?.trim();

const readEventData = (file: string | undefined, fallback: Record<string, unknown>) =>
  file?.trim()
    ? (JSON.parse(readFileSync(file.trim(), "utf8")) as Record<string, unknown>)
    : fallback;

// Checked before fixtures run so a partial config skips rather than failing in the fixture
const REQUIRED_ENV = ["CCD_USER_USERNAME", "CCD_USER_PASSWORD", "CLIENT_ID", "IDAM_SECRET"];

const user = { username: username ?? "", password: password ?? "" };

const createTestCase = (ccd: CcdCaseEventUtils) =>
  ccd.createCase({
    eventId: createEventId,
    eventData: readEventData(process.env.CCD_CREATE_EVENT_DATA_FILE, {
      applicantCaseName: `Playwright CcdCaseEventUtils ${Date.now()}`,
    }),
    user,
    summary: "Created by tcoe-playwright-example",
  });

test.describe("CcdCaseEventUtils against AAT CCD @api @ccd", () => {
  test.beforeEach(({}, testInfo) => {
    const missing = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
    testInfo.skip(
      missing.length > 0,
      `Missing ${missing.join(", ")}; set these to run against a real CCD data store`
    );
  });

  test("creates a case via the v2 API", async ({ ccdCaseEventUtils, config }, testInfo) => {
    const created = await createTestCase(ccdCaseEventUtils);

    await testInfo.attach("ccd-case", {
      body: JSON.stringify(
        { caseRef: created.id, caseType: created.case_type, state: created.state },
        null,
        2
      ),
      contentType: "application/json",
    });

    expect(created.id).toMatch(/^\d{16}$/);
    expect(created.case_type).toBe(config.ccd.caseType);
    expect(created.state).toBeTruthy();
  });

  test("starts and completes CCD_NEXT_EVENT_ID on a new case", async ({
    ccdCaseEventUtils,
  }, testInfo) => {
    testInfo.skip(
      !nextEventId,
      "Missing CCD_NEXT_EVENT_ID; set it (and optionally CCD_NEXT_EVENT_DATA_FILE) to fire an event on the new case"
    );
    const eventId = nextEventId ?? "";
    const created = await createTestCase(ccdCaseEventUtils);

    const { token, caseDetails } = await ccdCaseEventUtils.startEvent({
      caseRef: created.id,
      eventId,
      user,
    });
    expect(token).toBeTruthy();
    expect(String(caseDetails?.id)).toBe(created.id);

    const updated = await ccdCaseEventUtils.completeEvent({
      caseRef: created.id,
      eventId,
      eventData: readEventData(process.env.CCD_NEXT_EVENT_DATA_FILE, {}),
      user,
    });
    expect(String(updated.id)).toBe(created.id);
  });
});
