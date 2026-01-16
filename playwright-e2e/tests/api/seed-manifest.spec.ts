import http from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../../fixtures";

test.describe("Seed manifest fixture @api @refdata", () => {
  test("uses manifest case/task ids to fetch records deterministically", async ({
    seedManifest,
    createApiClient,
  }) => {
    const server = http.createServer((req, res) => {
      if (req.url?.startsWith("/cases/")) {
        const caseId = req.url.split("/").pop();
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ caseId }));
        return;
      }

      if (req.url?.startsWith("/tasks/")) {
        const taskId = req.url.split("/").pop();
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ taskId }));
        return;
      }

      res.writeHead(404).end();
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address() as AddressInfo;
    const client = createApiClient({
      baseUrl: `http://127.0.0.1:${address.port}`,
      name: "seed-manifest-demo",
    });

    try {
      const caseResponse = await client.get<{ caseId: string }>(
        `/cases/${seedManifest.data.caseId}`
      );
      const taskResponse = await client.get<{ taskId: string }>(
        `/tasks/${seedManifest.data.taskId}`
      );

      expect(caseResponse.status).toBe(200);
      expect(taskResponse.status).toBe(200);
      expect(caseResponse.data.caseId).toBe(seedManifest.data.caseId);
      expect(taskResponse.data.taskId).toBe(seedManifest.data.taskId);
    } finally {
      await client.dispose();
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
