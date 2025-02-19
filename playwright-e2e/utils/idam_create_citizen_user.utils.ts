import { APIRequestContext, Page, request } from "@playwright/test";
import * as dotenv from "dotenv";
import { existsSync } from "fs";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

export class IdamCreateCitizenUtils {
  /**
   * Function to create a citizen user
   * @param {APIRequestContext} apiContext The API request context
   * @param {string} token Bearer token passed from global setup
   * @returns {Promise<{ email: string; password: string; id: string }>} The created user's details
   */
  public async createCitizenUser(
    apiContext: APIRequestContext,
    token: string
  ): Promise<{ email: string; password: string; id: string }> {
    if (!process.env.IDAM_CITIZEN_USER_PASSWORD) {
      throw new Error("PASSWORD environment variable is not defined.");
    }

    const uniqueId = uuidv4();
    const password = process.env.IDAM_CITIZEN_USER_PASSWORD as string;
    const email = `TEST_PRL_USER_citizen-user.${uniqueId}@test.local`;

    try {
      const response = await apiContext.post(
        process.env.IDAM_TESTING_SUPPORT_USERS_URL as string,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          data: {
            password,
            user: {
              id: uniqueId,
              email,
              forename: "fn_" + uniqueId.split("-")[0],
              surname: "sn_" + uniqueId.split("-")[1],
              roleNames: ["citizen"],
            },
          },
        }
      );

      if (response.status() !== 201) {
        const errorData = await response.json();
        throw new Error(
          `Response from IDAM was not successful: ${JSON.stringify(
            errorData
          )}\nStatus Code: ${response.status()}`
        );
      }

      const responseData = await response.json();
      if (existsSync(".env")) {
        console.log("User created:", responseData);
      }

      return { email, password, id: responseData.id };
    } catch (error) {
      console.error(
        "Error: Unable to create the citizen user. Please check your VPN connection and confirm that the IDAM service is available."
      );
      throw new Error(
        `Failed to create citizen user. Check the URL or your network connection. ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Sets up a citizen user with an existing token and initialized API context.
   * @param {string} token Bearer token from global setup
   * @returns {Promise<{ email: string; password: string; id: string }>} User information if successful
   */
  public async setupUser(
    token: string
  ): Promise<{ email: string; password: string; id: string }> {
    const apiContext = await request.newContext();
    try {
      return await this.createCitizenUser(apiContext, token);
    } finally {
      await apiContext.dispose();
    }
  }

  /**
   * Function to sign in a citizen user using Playwright's Page object
   * @param {Page} page The Playwright page instance
   * @param {string} application The application URL
   */
  public async signInCitizenUser(page: Page, application: string): Promise<void> {
    const token = process.env.CITIZEN_CREATE_USER_BEARER_TOKEN; //use the token that we retrieved in IdamAccessTokenUtils
    if (!token) {
      console.error("Bearer token is not defined in the environment variables.");
      return;
    }
    const userInfo = await this.setupUser(token);
    if (!userInfo) {
      console.error("Failed to set up citizen user.");
      return;
    }
    if (!page.url().includes("idam-web-public.")) {
      await page.goto(application);
    }
    await page.fill("input[name='username']", userInfo.email);
    await page.fill("input[name='password']", userInfo.password);
    await page.click("button[type='submit']");
  }
}
