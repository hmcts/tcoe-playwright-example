import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../../fixtures";

test.describe("XSRF header helper @api @security", () => {
  test("adds X-XSRF-TOKEN header from stored session", async ({
    xsrfHeaders,
    createApiClient,
  }) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pw-xsrf-"));
    const sessionFile = path.join(tmpDir, "state.json");
    fs.writeFileSync(
      sessionFile,
      JSON.stringify({
        cookies: [
          {
            name: "XSRF-TOKEN",
            value: "xsrf-token-123",
            domain: "127.0.0.1",
            path: "/",
          },
        ],
      }),
      "utf8"
    );

    const server = http.createServer((req, res) => {
      const token = req.headers["x-xsrf-token"];
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ token }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      name: "xsrf-demo",
    });

    try {
      const headers = xsrfHeaders(sessionFile);
      const response = await client.post<{ token: string }>("/xsrf", {
        headers,
      });

      expect(response.status).toBe(200);
      expect(response.data.token).toBe("xsrf-token-123");
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
