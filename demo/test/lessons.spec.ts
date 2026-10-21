import { expect, test } from '@playwright/test'

test('clicking the photo moves the focus, in the code and the square', async ({ page }) => {
  await page.goto('/')
  const picker = page.locator('.picker')
  await picker.scrollIntoViewIfNeeded()
  const box = (await picker.boundingBox())!
  const square = page.locator('.picker').locator('xpath=ancestor::li').locator('.rml-gallery-slide:not([aria-hidden]) img')
  const before = await square.getAttribute('style')
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height * 0.5)
  await expect(page.getByText('focus: [0.75, 0.5]')).toBeVisible()
  expect(await square.getAttribute('style')).not.toBe(before)
})

test('peek shows the next photo at the right edge', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const step = page.locator('#learn ol > li').nth(3)
  await step.evaluate((el) => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
  await step.getByRole('switch', { name: 'Peek at the next' }).click()
  const box = (await step.locator('.rml-gallery-box').boundingBox())!
  const next = (await step.locator('.rml-gallery-slide[data-index="1"]').boundingBox())!
  // One photo (the box less 56) and a 12px gap along, so 56 - 12 = 44 of it shows.
  expect(Math.round(box.x + box.width - next.x)).toBe(44)
})
