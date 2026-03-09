import { test, expect } from "@playwright/test"
import path from "path"
import fs from "fs"

const fixtureFile = path.join(__dirname, "fixtures", "test-doc.docx")

async function uploadAndStartTranslation(
  page: import("@playwright/test").Page,
) {
  await page.goto("/")
  const fileInput = page.locator('input[type="file"][accept=".docx"]')
  await fileInput.setInputFiles(fixtureFile)
  await expect(page.locator("#filename-input")).toBeVisible()

  const filenameInput = page.locator("#filename-input")
  await filenameInput.clear()
  await filenameInput.fill("my-test-doc")

  await page
    .getByRole("combobox")
    .filter({ hasText: "Select language" })
    .click()
  await page.getByRole("option", { name: "German" }).click()

  await page.getByRole("button", { name: "Translate" }).click()
}

test("navigating directly to /translate without a file redirects to /", async ({
  page,
}) => {
  await page.goto("/translate")
  await page.waitForURL("/")
  await expect(
    page.getByRole("heading", { name: "Translate documents, smarter." }),
  ).toBeVisible()
})

test("mocked happy path: stat cards show correct values", async ({ page }) => {
  const docxBuffer = fs.readFileSync(fixtureFile)

  await page.route("**/api/translate", async (route) => {
    await route.fulfill({
      json: {
        statusCode: 200,
        total_segments: 10,
        reused_segments: 6,
        cost_savings: 0.0042,
        key: "test-doc/de/test-doc.docx",
      },
    })
  })

  await page.route("**/api/document**", async (route) => {
    await route.fulfill({
      body: docxBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
  })

  await uploadAndStartTranslation(page)

  // Loading spinner should disappear
  await expect(page.getByText("Translating")).toBeHidden({ timeout: 15_000 })

  // Stat cards
  await expect(page.getByText("Total Segments")).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText("10")).toBeVisible()

  await expect(page.getByText("Reuse Rate")).toBeVisible()
  await expect(page.getByText("60.0%")).toBeVisible()

  await expect(page.getByText("Cost Savings")).toBeVisible()
  await expect(page.getByText("$0.0042")).toBeVisible()

  // Filename in editor header
  await expect(page.getByText("my-test-doc.docx")).toBeVisible()
})

test("mocked happy path: Edit button toggles to Editing state", async ({
  page,
}) => {
  const docxBuffer = fs.readFileSync(fixtureFile)

  await page.route("**/api/translate", async (route) => {
    await route.fulfill({
      json: {
        statusCode: 200,
        total_segments: 10,
        reused_segments: 6,
        cost_savings: 0.0042,
        key: "test-doc/de/test-doc.docx",
      },
    })
  })

  await page.route("**/api/document**", async (route) => {
    await route.fulfill({
      body: docxBuffer,
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })
  })

  await uploadAndStartTranslation(page)
  await expect(page.getByText("Translating")).toBeHidden({ timeout: 15_000 })

  // Wait for editor to be ready and Edit button to appear
  const editButton = page.getByRole("button", { name: "Edit" })
  await expect(editButton).toBeVisible({ timeout: 30_000 })

  await editButton.click()

  // Button label changes to "Editing"
  await expect(page.getByRole("button", { name: "Editing" })).toBeVisible()
  // Save button appears
  await expect(page.getByRole("button", { name: "Save" })).toBeVisible()
})
