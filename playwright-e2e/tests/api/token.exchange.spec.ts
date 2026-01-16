import http from "node:http";
import type { AddressInfo } from "node:net";
import { buildApiAttachment } from "@hmcts/playwright-common";
import { expect, test } from "../../fixtures";
import { shouldIncludeRawBodies } from "../../utils/api-telemetry";

test.describe("Token exchange API @api @security", () => {
  test("returns 200 with masked access token when valid credentials provided", async ({
    createApiClient,
    apiRecorder,
  }, testInfo) => {
    const server = http.createServer((req, res) => {
      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          res.writeHead(200, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              access_token: "super-secret-token",
              expires_in: 3600,
            })
          );
        });
      } else {
        res.writeHead(404).end();
      }
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;

    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      name: "token-service",
    });

    try {
      const includeRawBodies = shouldIncludeRawBodies(process.env);
      const response = await client.post<{ access_token: string }>(
        "/oauth/token",
        {
          data: {
            grant_type: "client_credentials",
            clientSecret: "should-be-masked",
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.access_token).toBe("super-secret-token");

      // Validate that the masked entry is recorded for attachments
      expect(apiRecorder.hasEntries()).toBe(true);
      const attachmentPayload = JSON.parse(apiRecorder.toJson());
      const recordedCall = attachmentPayload[0];

      expect(recordedCall.request.data.clientSecret).toBe("[REDACTED]");
      expect(recordedCall.response.body.access_token).toBe("[REDACTED]");

      const attachment = buildApiAttachment(response.logEntry, {
        includeRaw: includeRawBodies,
      });
      await testInfo.attach(attachment.name, {
        body: attachment.body,
        contentType: attachment.contentType,
      });

      const attachmentJson = JSON.parse(attachment.body) as Record<
        string,
        unknown
      >;

      expect(!!attachmentJson.rawResponse).toBe(includeRawBodies);
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
