import { test as teardown } from "@playwright/test";

//example given by playwright below - needs to be build out
teardown("teardown case data", async ({}) => {
  console.log("e.g. delete case data via API etc");
});
