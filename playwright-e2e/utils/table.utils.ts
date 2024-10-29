import { Locator } from "playwright-core";

export class TableUtils {
  /**
   * Maps a given table as an object using table headers
   *
   * @param locator {@link Locator} - The table locator
   *
   */
  public async mapTable(table: Locator): Promise<Record<string, string>[]> {
    await table.scrollIntoViewIfNeeded({ timeout: 5000 });

    const tableData: Record<string, string>[] = [];
    const headers = await table.locator("thead th").allInnerTexts();
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();

    for (let i = 0; i < rowCount; i++) {
      const rowData: Record<string, string> = {};
      const cells = rows.nth(i).locator("td");

      const cellCount = await cells.count();
      for (let j = 0; j < cellCount; j++) {
        const header = headers[j];
        const cell = cells.nth(j);
        rowData[header] = await cell.innerText();
      }
      tableData.push(rowData);
    }

    return tableData;
  }
}
