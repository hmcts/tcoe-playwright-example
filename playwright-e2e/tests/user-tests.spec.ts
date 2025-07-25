import { expect, test } from "../fixtures";

test.describe("User tests using idam utils", () => {
  test("Update user", async ({
    page,
    config,
    citizenUserUtils,
    idamPage,
    idamUtils,
  }) => {
    //create citizen user
    const token = process.env.CREATE_USER_BEARER_TOKEN as string;
    const user = await citizenUserUtils.createUser();
    await page.goto(config.urls.citizenUrl);

    //login citizen user
    await idamPage.login({
      username: user.email,
      password: user.password,
    });

    //get user id for citizen user
    const userInfo = await idamUtils.getUserInfo({
      email: user.email,
      bearerToken: token,
    });
    console.log(userInfo);

    //update user with new forename and surname
    await idamUtils.updateUser({
      id: userInfo.id,
      bearerToken: token,
      password: user.password,
      user: {
        email: user.email,
        forename: "changed forename",
        surname: "changed surname",
        roleNames: ["citizen"],
      },
    });
  });
});
