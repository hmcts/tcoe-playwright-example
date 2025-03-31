import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// This needs to be placed somewhere before attempting to access any environment variables
dotenv.config();

export interface UserCredentials {
  username: string;
  password: string;
  sessionFile: string;
  cookieName?: string;
}

interface Urls {
  manageCaseBaseUrl: string;
  citizenUrl: string;
}

export interface Config {
  users: {
    solicitor: UserCredentials;
    caseManager: UserCredentials;
    judge: UserCredentials;
    citizen: UserCredentials;
  };
  urls: Urls;
}

export const config: Config = {
  users: {
    solicitor: {
      username: getEnvVar("SOLICITOR_USERNAME"),
      password: getEnvVar("SOLICITOR_PASSWORD"),
      sessionFile:
        path.join(fileURLToPath(import.meta.url), "../../.sessions/") +
        `${getEnvVar("SOLICITOR_USERNAME")}.json`,
      cookieName: "xui-webapp",
    },
    caseManager: {
      username: getEnvVar("CASEMANAGER_USERNAME"),
      password: getEnvVar("CASEMANAGER_PASSWORD"),
      sessionFile:
        path.join(fileURLToPath(import.meta.url), "../../.sessions/") +
        `${getEnvVar("CASEMANAGER_USERNAME")}.json`,
      cookieName: "xui-webapp",
    },
    judge: {
      username: getEnvVar("JUDGE_USERNAME"),
      password: getEnvVar("JUDGE_PASSWORD"),
      sessionFile:
        path.join(fileURLToPath(import.meta.url), "../../.sessions/") +
        `${getEnvVar("JUDGE_USERNAME")}.json`,
      cookieName: "xui-webapp",
    },
    citizen: {
      username: getEnvVar("CITIZEN_USERNAME"),
      password: getEnvVar("CITIZEN_PASSWORD"),
      sessionFile:
        path.join(fileURLToPath(import.meta.url), "../../.sessions/") +
        `${getEnvVar("CITIZEN_USERNAME")}.json`,
    },
  },
  urls: {
    manageCaseBaseUrl:
      process.env.MANAGE_CASES_BASE_URL ||
      "https://manage-case.aat.platform.hmcts.net/cases",
    citizenUrl:
      process.env.CITIZEN_FRONTEND_BASE_URL ||
      "https://privatelaw.aat.platform.hmcts.net/",
  },
};

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Error: ${name} environment variable is not set`);
  }
  return value;
}
