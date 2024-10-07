import { Page } from "@playwright/test";

export abstract class Base {
  constructor(protected readonly page: Page) {}
}
