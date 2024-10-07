import { test as teardown } from "@playwright/test";

//example given by playwright below - needs to be build out
teardown("delete database", async ({}) => {
  console.log("e.g. deleting test database...");
  // Delete the database
});
