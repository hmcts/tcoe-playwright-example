import { APIRequestContext } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

export class IdamAccessTokenUtils {
  //this payload is specific to creating an citizen user, but others can be added, for example, if you need to an IDAM token for case creation
  private citizenCreateUserData = {
    grant_type: "client_credentials",
    client_id: "insert-client-id",
    client_secret: process.env.IDAM_SECRET as string, // Sensitive information stored in .env variables, ensure this file is added to gitignore
    scope: "profile roles",
  };
  /**
   * Function to get an access token from the IDAM service
   * @param {string} option The option to determine which data set to use for the request
   * @param {APIRequestContext} apiContext The API request context
   * @returns {Promise<string>} The access token if successful, otherwise throws an error
   */
  public async getAccessToken(
    option: string,
    apiContext: APIRequestContext
  ): Promise<string> {
    let data;

    // Use a switch case to handle different payloads based on the option
    switch (option) {
      case "citizenCreateUser":
        data = this.citizenCreateUserData;
        break;
      default:
        throw new Error(`Unknown option: ${option}`);
    }

    try {
      const response = await apiContext.post(
        process.env.IDAM_TOKEN_URL as string,
        {
          headers: { "content-type": "application/x-www-form-urlencoded" },
          form: data,
        }
      );

      if (!response.ok()) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch access token: ${response.status()} - ${errorText}. Ensure your VPN is connected or check your URL/SECRET.`
        );
      }

      const responseData = await response.json();
      return responseData.access_token;
    } catch (error) {
      throw new Error(
        `An error occurred while fetching the access token: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
