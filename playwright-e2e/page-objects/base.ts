import {
  ExuiCaseDetailsComponent,
  ExuiCaseListComponent,
} from "@hmcts/playwright-common";
import { Page } from "@playwright/test";
import { CuiCaseListComponent, ExuiHeaderComponent } from "./components";

// A base page inherited by pages & components
// can contain any additional config needed + instantiated page object
export abstract class Base {
  readonly exuiCaseListComponent: ExuiCaseListComponent;
  readonly exuiCaseDetailsComponent: ExuiCaseDetailsComponent;
  readonly exuiHeader: ExuiHeaderComponent;
  readonly cuiCaseListComponent: CuiCaseListComponent;

  constructor(public readonly page: Page) {
    this.exuiCaseListComponent = new ExuiCaseListComponent(this.page);
    this.exuiCaseDetailsComponent = new ExuiCaseDetailsComponent(this.page);
    this.exuiHeader = new ExuiHeaderComponent(this.page);
    this.cuiCaseListComponent = new CuiCaseListComponent(this.page);
  }
}
