import dotenv from "dotenv";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// This needs to be placed somewhere before attempting to access any environment variables
dotenv.config();

export interface UserCredentials {
  username: string;
  password: string;
  sessionFile: string;
}

interface Urls {
  manageCaseBaseUrl: string;
  citizenUrl: string;
}

export interface Config {
  users: {
    exui: UserCredentials;
    citizen: UserCredentials;
  };
  urls: Urls;
}

export const config: Config = {
  users: {
    exui: {
      username: getEnvVar("EXUI_USERNAME"),
      password: getEnvVar("EXUI_PASSWORD"),
      sessionFile:
        path.join(fileURLToPath(import.meta.url), "../../.sessions/") +
        `${getEnvVar("EXUI_USERNAME")}.json`,
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
    manageCaseBaseUrl: getEnvVar("MANAGE_CASES_BASE_URL"),
    citizenUrl: getEnvVar("CITIZEN_FRONTEND_BASE_URL"),
  },
};

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Error: ${name} environment variable is not set`);
  }
  return value;
}

export function getCookies(filepath: string) {
  const data = fs.readFileSync(filepath, "utf8");
  return JSON.parse(data).cookies;
}
