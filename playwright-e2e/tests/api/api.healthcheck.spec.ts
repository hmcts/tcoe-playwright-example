import http from "http";
import type { AddressInfo } from "net";
import { expect, test } from "../../fixtures";

test.describe("API smoke checks @api", () => {
  test("health endpoint responds with OK", async ({ createApiClient }) => {
    const server = http.createServer((_, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const client = createApiClient({
      baseUrl,
      name: "sample-health",
    });

    try {
      const response = await client.get<{ status: string }>("/");
      expect(response.status).toBe(200);
      expect(response.data.status).toBe("ok");
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
