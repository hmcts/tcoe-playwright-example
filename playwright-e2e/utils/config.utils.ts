import path from "path";
import { fileURLToPath } from "url";

interface UserCredentials {
  username: string;
  password: string;
}

interface Urls {
  manageCaseBaseUrl: string;
  citizenUrl: string;
}

export interface ConfigFixture {
  sessionStoragePath: string;
  users: {
    exui: UserCredentials;
    citizen: UserCredentials;
  };
  urls: Urls;
}

export const config: ConfigFixture = {
  sessionStoragePath: path.join(
    fileURLToPath(import.meta.url),
    "../.sessions/"
  ),
  users: {
    exui: {
      username: getEnvVar("EXUI_USERNAME"),
      password: getEnvVar("EXUI_PASSWORD"),
    },
    citizen: {
      username: getEnvVar("CITIZEN_USERNAME"),
      password: getEnvVar("CITIZEN_PASSWORD"),
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
