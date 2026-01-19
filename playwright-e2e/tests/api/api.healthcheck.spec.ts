import http from "node:http";
import type { AddressInfo } from "node:net";
import {
  isRetryableError,
  type ApiClient,
  withRetry,
} from "@hmcts/playwright-common";
import { expect, test } from "../../fixtures";

async function waitForReadiness(client: ApiClient) {
  return withRetry(
    () => client.get<{ status: string }>("/", { throwOnError: true }),
    5,
    50,
    250,
    5000,
    isRetryableError
  );
}

test.describe("API health check @api @smoke", () => {
  test("returns 200 from readiness endpoint after retrying 503 failures", async ({
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
