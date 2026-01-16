import { SessionUtils } from "@hmcts/playwright-common";

export type XsrfHeaderBuilder = (
  sessionFile: string,
  extraHeaders?: Record<string, string>
) => Record<string, string>;

export function buildXsrfHeaders(
  sessionFile: string,
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const xsrfToken = resolveXsrfToken(sessionFile);
  return {
    ...extraHeaders,
    "X-XSRF-TOKEN": xsrfToken,
  };
}

export function resolveXsrfToken(sessionFile: string): string {
  const cookies = SessionUtils.getCookies(sessionFile);
  const xsrfCookie = cookies.find(
    (cookie) => cookie.name?.toLowerCase() === "xsrf-token"
  );

  if (!xsrfCookie?.value) {
    throw new Error(
      `XSRF token not found in session file: ${sessionFile}. Ensure the session is valid.`
    );
  }

  return xsrfCookie.value;
}
