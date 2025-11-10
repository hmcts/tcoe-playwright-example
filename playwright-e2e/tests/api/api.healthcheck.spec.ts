import http from "http";
import type { AddressInfo } from "net";
import type { ApiClient } from "@hmcts/playwright-common";
import { expect, test } from "../../fixtures";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForReadiness(
  client: ApiClient,
  maxAttempts = 5,
  waitMs = 50
) {
  let response = await client.get<{ status: string }>("/", {
    throwOnError: false,
  });

  for (let attempt = 1; attempt < maxAttempts && response.status !== 200; attempt++) {
    await delay(waitMs);
    response = await client.get<{ status: string }>("/", {
      throwOnError: false,
    });
  }

  return response;
}

test.describe("API health check @api", () => {
  test("polls readiness endpoint with retries", async ({
    createApiClient,
    apiRecorder,
  }) => {
    let callCount = 0;
    const server = http.createServer((_, res) => {
      callCount += 1;
      if (callCount < 3) {
        res.writeHead(503, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "starting" }));
        return;
      }

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ready" }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const client = createApiClient({
      baseUrl,
      name: "sample-health",
    });

    try {
      const response = await waitForReadiness(client);

      expect(response.status).toBe(200);
      expect(response.data.status).toBe("ready");
      expect(apiRecorder.hasEntries()).toBe(true);
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
