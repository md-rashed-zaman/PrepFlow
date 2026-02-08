import { test, expect } from "@playwright/test";
import { uniqEmail, expectNoClientError } from "./_helpers";

test("lists import -> contest generate -> stats renders", async ({ page }) => {
  const email = uniqEmail("lcs");
  const password = "pass123";

  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  // Register
  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/today$/);

  // Import a template list
  await page.goto("/lists");
  await expect(page.getByRole("heading", { name: "Collections" })).toBeVisible();
  await page.getByRole("button", { name: "Import Blind 75" }).click();

  // Should select imported list and render some items.
  await expect(page.getByRole("heading", { name: "Blind 75" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Two Sum" })).toBeVisible();

  // Generate a contest
  await page.goto("/contests");
  await expect(page.getByRole("heading", { name: "Timed sessions" })).toBeVisible();
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText("Contest generated.")).toBeVisible();

  // Start + submit results (defaults to grade 2 if not selected).
  await page.getByRole("button", { name: "Start" }).click();
  await page.getByRole("button", { name: "Submit results" }).click();
  await expect(page.getByText("Results saved.")).toBeVisible();

  // Stats should render.
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "Progress signals" })).toBeVisible();
  await expectNoClientError(page);
  expect(pageErrors, `page errors: ${pageErrors.join("\n")}`).toHaveLength(0);
});

