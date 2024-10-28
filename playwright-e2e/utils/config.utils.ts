import path from "path";

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
        path.join(__dirname, "../.sessions/") +
        `${getEnvVar("EXUI_USERNAME")}.json`,
    },
    citizen: {
      username: getEnvVar("CITIZEN_USERNAME"),
      password: getEnvVar("CITIZEN_PASSWORD"),
      sessionFile:
        path.join(__dirname, "../.sessions/") +
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
