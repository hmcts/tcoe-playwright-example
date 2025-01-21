import { Page } from "@playwright/test";

// A base page inherited by pages & components
// can contain any additional config needed + instantiated page object
export abstract class Base {
  constructor(public readonly page: Page) {}
}
