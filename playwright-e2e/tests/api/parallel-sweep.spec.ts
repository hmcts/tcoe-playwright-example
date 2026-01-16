import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../../fixtures";
import { parallelGet } from "../../utils/parallel-requests";

test.describe("Parallel read sweep @api @refdata", () => {
  test("sweeps read-only endpoints in batches to limit concurrency", async ({
    createApiClient,
  }) => {
    const server = http.createServer((req, res) => {
      if (!req.url?.startsWith("/items/")) {
        res.writeHead(404).end();
        return;
      }
      const id = req.url.split("/").pop();
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id }));
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      name: "parallel-sweep-demo",
    });

    try {
      const paths = Array.from({ length: 12 }, (_, index) => `/items/${index}`);
      const results = await parallelGet<{ id: string }>(client, paths, {
        batchSize: 3,
      });

      expect(results).toHaveLength(paths.length);
      results.forEach((result, index) => {
        expect(result.status).toBe(200);
        expect(result.data.id).toBe(String(index));
      });
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
