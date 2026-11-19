import http from "node:http";
import type { AddressInfo } from "node:net";
import {
  CcdCaseEventUtils,
  type IdamUtils,
  type ServiceAuthUtils,
} from "@hmcts/playwright-common";
import { expect, test } from "../../fixtures";

const CASE_TYPE = "PRLAPPS";
const CASE_REF = "1234567890123456";

type RecordedRequest = {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: Record<string, unknown> | undefined;
};

type StubResponse = { status: number; body: unknown };
type StubHandler = (req: RecordedRequest) => StubResponse | undefined;

/**
 * Minimal CCD data store v2 stub. Each route can be overridden per test;
 * every request is recorded so assertions can inspect headers and bodies.
 */
async function startCcdStub(overrides: StubHandler = () => undefined) {
  const requests: RecordedRequest[] = [];

  const defaults: StubHandler = ({ method, url, body }) => {
    if (method === "GET" && url === `/case-types/${CASE_TYPE}/event-triggers/createCase`) {
      return { status: 200, body: { token: "start-case-token" } };
    }
    if (method === "POST" && url === `/case-types/${CASE_TYPE}/cases`) {
      return {
        status: 201,
        body: { id: Number(CASE_REF), state: "Submitted", data: body?.data },
      };
    }
    if (method === "GET" && url === `/cases/${CASE_REF}/event-triggers/submit`) {
      return {
        status: 200,
        body: {
          token: "start-event-token",
          case_details: { id: CASE_REF, state: "Submitted", data: { applicantName: "Test" } },
        },
      };
    }
    if (method === "POST" && url === `/cases/${CASE_REF}/events`) {
      return { status: 201, body: { id: CASE_REF, state: "CaseIssued", data: body?.data } };
    }
    return undefined;
  };

  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const recorded: RecordedRequest = {
        method: req.method ?? "",
        url: req.url ?? "",
        headers: req.headers,
        body: raw ? JSON.parse(raw) : undefined,
      };
      requests.push(recorded);
      const response = overrides(recorded) ??
        defaults(recorded) ?? { status: 404, body: { message: "not stubbed" } };
      res.writeHead(response.status, { "content-type": "application/json" });
      res.end(JSON.stringify(response.body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function createAuthStubs() {
  const idamCalls: Record<string, unknown>[] = [];
  const s2sCalls: Record<string, unknown>[] = [];
  const idamUtils = {
    generateIdamToken: async (payload: Record<string, unknown>) => {
      idamCalls.push(payload);
      return `user-token-for-${String(payload.username)}`;
    },
  } as unknown as IdamUtils;
  const serviceAuthUtils = {
    retrieveToken: async (payload: Record<string, unknown>) => {
      s2sCalls.push(payload);
      return "s2s-token";
    },
  } as unknown as ServiceAuthUtils;
  return { idamUtils, serviceAuthUtils, idamCalls, s2sCalls };
}

test.describe("CcdCaseEventUtils against a stubbed CCD data store @api", () => {
  test("creates a case then fires an event using the v2 API", async () => {
    const stub = await startCcdStub();
    const auth = createAuthStubs();
    const ccd = new CcdCaseEventUtils({
      idamUtils: auth.idamUtils,
      serviceAuthUtils: auth.serviceAuthUtils,
      ccdUrl: stub.url,
      caseType: CASE_TYPE,
      microservice: "prl_cos_api",
      idamClient: { clientId: "prl-cos-api", clientSecret: "secret" },
    });
    const solicitor = { username: "solicitor@example.com", password: "pw" };

    try {
      const created = await ccd.createCase({
        eventId: "createCase",
        eventData: { applicantName: "Test" },
        user: solicitor,
      });
      expect(created.id).toBe(CASE_REF);
      expect(typeof created.id).toBe("string");

      const updated = await ccd.completeEvent({
        caseRef: "1234-5678-9012-3456",
        eventId: "submit",
        eventData: { issued: "Yes" },
        summary: "issued by test",
        user: solicitor,
      });
      expect(updated.state).toBe("CaseIssued");

      expect(stub.requests.map((r) => `${r.method} ${r.url}`)).toEqual([
        `GET /case-types/${CASE_TYPE}/event-triggers/createCase`,
        `POST /case-types/${CASE_TYPE}/cases`,
        `GET /cases/${CASE_REF}/event-triggers/submit`,
        `POST /cases/${CASE_REF}/events`,
      ]);

      const [startCase, createCase, , submitEvent] = stub.requests;
      expect(startCase.headers.accept).toContain("start-case-trigger.v2+json");
      expect(startCase.headers.authorization).toBe(
        "Bearer user-token-for-solicitor@example.com"
      );
      expect(startCase.headers.serviceauthorization).toBe("Bearer s2s-token");
      expect(startCase.headers.experimental).toBe("true");

      expect(createCase.headers["content-type"]).toContain("create-case.v2+json");
      expect(createCase.body).toEqual({
        data: { applicantName: "Test" },
        event: { id: "createCase", summary: "", description: "" },
        event_token: "start-case-token",
        ignore_warning: false,
      });

      expect(submitEvent.headers["content-type"]).toContain("create-event.v2+json");
      expect(submitEvent.body).toMatchObject({
        data: { issued: "Yes" },
        event: { id: "submit", summary: "issued by test" },
        event_token: "start-event-token",
      });

      // IDAM token is cached per user and S2S is leased once per instance
      expect(auth.idamCalls).toHaveLength(1);
      expect(auth.idamCalls[0]).toMatchObject({
        grantType: "password",
        clientId: "prl-cos-api",
        scope: "openid profile roles",
        username: "solicitor@example.com",
      });
      expect(auth.s2sCalls).toEqual([{ microservice: "prl_cos_api" }]);
    } finally {
      await ccd.dispose();
      await stub.close();
    }
  });

  test("startEvent returns the event token and current case details", async () => {
    const stub = await startCcdStub();
    const auth = createAuthStubs();
    const ccd = new CcdCaseEventUtils({
      ...auth,
      ccdUrl: stub.url,
      caseType: CASE_TYPE,
      microservice: "prl_cos_api",
    });

    try {
      const result = await ccd.startEvent({
        caseRef: CASE_REF,
        eventId: "submit",
        user: { bearerToken: "existing-token" },
      });
      expect(result.token).toBe("start-event-token");
      expect(result.caseDetails?.data).toEqual({ applicantName: "Test" });
      expect(stub.requests[0].headers.authorization).toBe("Bearer existing-token");
      expect(auth.idamCalls).toHaveLength(0);
    } finally {
      await ccd.dispose();
      await stub.close();
    }
  });

  test("retries a 5xx with a fresh event token", async () => {
    let failures = 0;
    const stub = await startCcdStub(({ method, url }) => {
      if (method === "POST" && url === `/cases/${CASE_REF}/events` && failures === 0) {
        failures++;
        return { status: 503, body: { message: "temporarily unavailable" } };
      }
      return undefined;
    });
    const auth = createAuthStubs();
    const ccd = new CcdCaseEventUtils({
      ...auth,
      ccdUrl: stub.url,
      caseType: CASE_TYPE,
      microservice: "prl_cos_api",
      retry: { attempts: 3, baseMs: 10 },
    });

    try {
      const result = await ccd.completeEvent({
        caseRef: CASE_REF,
        eventId: "submit",
        user: { bearerToken: "t" },
      });
      expect(result.state).toBe("CaseIssued");
      expect(stub.requests.map((r) => `${r.method} ${r.url}`)).toEqual([
        `GET /cases/${CASE_REF}/event-triggers/submit`,
        `POST /cases/${CASE_REF}/events`,
        `GET /cases/${CASE_REF}/event-triggers/submit`,
        `POST /cases/${CASE_REF}/events`,
      ]);
    } finally {
      await ccd.dispose();
      await stub.close();
    }
  });

  test("fails fast on 422 and surfaces the CCD response body", async () => {
    const stub = await startCcdStub(({ method }) =>
      method === "POST"
        ? { status: 422, body: { message: "Case data validation failed" } }
        : undefined
    );
    const auth = createAuthStubs();
    const ccd = new CcdCaseEventUtils({
      ...auth,
      ccdUrl: stub.url,
      caseType: CASE_TYPE,
      microservice: "prl_cos_api",
      retry: { attempts: 3, baseMs: 10 },
    });

    try {
      await expect(
        ccd.completeEvent({ caseRef: CASE_REF, eventId: "submit", user: { bearerToken: "t" } })
      ).rejects.toThrow(/Case data validation failed.*Status Code: 422/);
      expect(stub.requests.filter((r) => r.method === "POST")).toHaveLength(1);
    } finally {
      await ccd.dispose();
      await stub.close();
    }
  });

  test("rejects invalid case references and missing idamClient", async () => {
    const auth = createAuthStubs();
    const ccd = new CcdCaseEventUtils({
      ...auth,
      ccdUrl: "http://127.0.0.1:1",
      caseType: CASE_TYPE,
      microservice: "prl_cos_api",
    });

    try {
      await expect(
        ccd.completeEvent({ caseRef: "123", eventId: "submit", user: { bearerToken: "t" } })
      ).rejects.toThrow("Invalid CCD case reference: 123");
      await expect(
        ccd.createCase({ eventId: "createCase", user: { username: "u", password: "p" } })
      ).rejects.toThrow(/needs idamClient/);
    } finally {
      await ccd.dispose();
    }
  });
});
