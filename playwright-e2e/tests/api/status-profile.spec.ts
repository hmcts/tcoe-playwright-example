import http from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "../../fixtures";
import { assertStatusProfile } from "../../utils/status-profile";

test.describe("Status profile contracts @api @security", () => {
  test("verifies status-profile contracts for success, validation, auth", async ({
    createApiClient,
  }) => {
    const server = http.createServer((req, res) => {
      switch (req.url) {
        case "/ok":
          res.writeHead(200, { "content-type": "application/json" });
          res.end(JSON.stringify({ status: "ok", data: { value: 42 } }));
          return;
        case "/invalid":
          res.writeHead(400, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              errors: [{ message: "caseId is required", field: "caseId" }],
            })
          );
          return;
        case "/secure":
          res.writeHead(401, { "content-type": "application/json" });
          res.end(JSON.stringify({ message: "unauthorized", code: "AUTH" }));
          return;
        default:
          res.writeHead(404).end();
      }
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      name: "status-profile-demo",
    });

    try {
      const ok = await client.get("/ok", { throwOnError: false });
      const invalid = await client.get("/invalid", { throwOnError: false });
      const secure = await client.get("/secure", { throwOnError: false });

      assertStatusProfile(ok, "success");
      assertStatusProfile(invalid, "validation");
      assertStatusProfile(secure, "auth");
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
