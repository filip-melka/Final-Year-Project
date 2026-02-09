import { test, expect } from "@playwright/test"
import path from "path"

const fixtureFile = path.join(__dirname, "fixtures", "test-doc.docx")

test("upload, rename, translate to German, and download as DOCX and PDF", async ({
  page,
}) => {
  // 1. Navigate to home page
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Welcome to Polydoc" }),
  ).toBeVisible()

  // 2. Upload DOCX file
  const fileInput = page.locator('input[type="file"][accept=".docx"]')
  await fileInput.setInputFiles(fixtureFile)

  // 3. Rename the file
  const filenameInput = page.locator("#filename-input")
  await expect(filenameInput).toBeVisible()
  await filenameInput.clear()
  await filenameInput.fill("my-test-doc")

  // 4. Select German language
  await page
    .getByRole("combobox")
    .filter({ hasText: "Select language" })
    .click()
  await page.getByRole("option", { name: "German" }).click()

  // 5. Click Translate
  await page.getByRole("button", { name: "Translate" }).click()

  // 6. Wait for translation to complete (up to 5 minutes)
  await expect(page.getByText("Translating")).toBeHidden({
    timeout: 300_000,
  })

  // 7. Verify translation result stat cards
  await expect(page.getByText("Total Segments")).toBeVisible({
    timeout: 300_000,
  })
  await expect(page.getByText("Reuse Rate")).toBeVisible()
  await expect(page.getByText("Cost Savings")).toBeVisible()

  // 8. Verify filename in editor header
  await expect(page.getByText("my-test-doc.docx")).toBeVisible()

  // 9. Wait for editor to be ready
  await expect(page.getByRole("button", { name: "Edit" })).toBeVisible({
    timeout: 30_000,
  })

  // 10. Download PDF (select defaults to "docx", so picking PDF triggers onValueChange)
  const [pdfDownload] = await Promise.all([
    page.waitForEvent("download"),
    (async () => {
      await page.getByText("Download").click()
      await page.getByRole("option", { name: "PDF" }).click()
    })(),
  ])
  expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/)

  // 11. Download DOCX (value is now "pdf", so picking DOCX triggers onValueChange)
  const [docxDownload] = await Promise.all([
    page.waitForEvent("download"),
    (async () => {
      await page.getByText("Download").click()
      await page.getByRole("option", { name: "DOCX" }).click()
    })(),
  ])
  expect(docxDownload.suggestedFilename()).toContain("my-test-doc")
  expect(docxDownload.suggestedFilename()).toMatch(/\.docx$/)
  expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/)
})
