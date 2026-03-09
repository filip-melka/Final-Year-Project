import { test, expect } from "@playwright/test"
import path from "path"

const fixtureFile = path.join(__dirname, "fixtures", "test-doc.docx")

async function uploadFile(page: import("@playwright/test").Page) {
  await page.goto("/")
  const fileInput = page.locator('input[type="file"][accept=".docx"]')
  await fileInput.setInputFiles(fixtureFile)
  await expect(page.locator("#filename-input")).toBeVisible()
}

test("filename field is pre-populated with file name without extension", async ({
  page,
}) => {
  await uploadFile(page)
  const filenameInput = page.locator("#filename-input")
  await expect(filenameInput).toHaveValue("test-doc")
})

test("filename can be edited", async ({ page }) => {
  await uploadFile(page)
  const filenameInput = page.locator("#filename-input")
  await filenameInput.clear()
  await filenameInput.fill("my-renamed-doc")
  await expect(filenameInput).toHaveValue("my-renamed-doc")
})

test("language dropdown contains expected options", async ({ page }) => {
  await uploadFile(page)
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select language" })
    .click()
  await expect(page.getByRole("option", { name: "German" })).toBeVisible()
  await expect(page.getByRole("option", { name: "French" })).toBeVisible()
})

test("Cancel button closes the dialog", async ({ page }) => {
  await uploadFile(page)
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(page.locator("#filename-input")).not.toBeVisible()
})

test("Translate button is disabled when no language is selected", async ({
  page,
}) => {
  await uploadFile(page)
  await expect(page.getByRole("button", { name: "Translate" })).toBeDisabled()
})
