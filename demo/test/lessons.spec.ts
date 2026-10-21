import { expect, test } from '@playwright/test'

test('clicking the photo moves the focus, in the code and the square', async ({ page }) => {
  await page.goto('/')
  const picker = page.locator('.picker')
  await picker.scrollIntoViewIfNeeded()
  const box = (await picker.boundingBox())!
  const square = page.locator('.picker + .rml-gallery img')
  const before = await square.getAttribute('style')
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.5)
  await expect(page.getByText('focus: [0.75, 0.5]')).toBeVisible()
  expect(await square.getAttribute('style')).not.toBe(before)
})
