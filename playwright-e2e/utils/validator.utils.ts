import { expect } from "../fixtures";

export class ValidatorUtils {
  /**
   * Validate a case number is made of only digits
   *
   * @param caseNumber {@link string} - the case number
   *
   */
  public validateCaseNumber(caseNumber: string) {
    // HMCTS case numbers are typically 16 digits (e.g., 1234567812345678).
    // CCD generates these as sequential IDs. Current validation accepts any digit-only string;
    // if stricter formatting is required (e.g., exact length, prefix rules), update this regex.
    expect(caseNumber).toMatch(/^\d+$/);
  }

  /**
   * Validate the case type is only within caseTypes
   *
   * @param caseType {@link string} - the case type
   *
   */
  public validateCaseType(caseType: string) {
    const validCaseTypes = ["C100", "FL401"];
    expect(validCaseTypes.includes(caseType)).toBeTruthy();
  }

  /**
   * Validate the status is only within statuses
   *
   * @param status {@link string} - the case number
   *
   */
  public validateStatus(status: string) {
    const validStatuses = [
      "Draft",
      "Application submitted",
      "Drafft",
      "Cyflwynwyd y cais",
    ];
    expect(validStatuses.includes(status)).toBeTruthy();
  }

  /**
   * Validates a given date in the format of "18 Oct 2024"
   * and ensures the date can be parsed
   *
   * @param caseNumber {@link string} - the case number
   *
   */
  public validateDate(date: string) {
    const dateRegex =
      /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}$/;
    expect(date).toMatch(dateRegex);
    expect(Date.parse(date)).not.toBe(Number.NaN);
  }
}
