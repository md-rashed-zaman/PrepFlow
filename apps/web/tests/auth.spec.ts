import { test, expect } from "@playwright/test";
import { uniqEmail, expectNoClientError } from "./_helpers";

test("register -> lands on Today -> logout -> login works", async ({ page }) => {
  const email = uniqEmail("auth");
  const password = "pass123";

  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(String(e)));

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "Due reviews" })).toBeVisible();
  await expectNoClientError(page);
  expect(pageErrors, `page errors: ${pageErrors.join("\n")}`).toHaveLength(0);

  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/login/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(/\/today$/);
  await expect(page.getByRole("heading", { name: "Due reviews" })).toBeVisible();
  await expectNoClientError(page);
});

