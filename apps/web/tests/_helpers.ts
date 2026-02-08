import { expect, type Page } from "@playwright/test";

export function uniqEmail(prefix = "pf") {
  const n = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${n}-${r}@example.com`;
}

export async function expectNoClientError(page: Page) {
  // Next.js generic fatal page for runtime errors.
  await expect(page.locator("body")).not.toContainText(
    "Application error: a client-side exception has occurred while loading",
  );
}

