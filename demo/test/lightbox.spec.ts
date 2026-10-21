import { expect, test } from '@playwright/test'

// With one item there are no arrows, and the picture used to land in a
// 0px-wide grid column and never render (0.1.0).
for (const hasTouch of [false, true]) {
  test(`one item shows its picture${hasTouch ? ' on a touch screen' : ''}`, async ({ browser }) => {
    const page = await browser.newPage({ hasTouch })
    await page.goto('/test/one.html')
    const view = page.locator('.rml-view')
    await expect(view.locator('img')).toBeVisible()
    expect((await view.boundingBox())!.width).toBeGreaterThan(100)
  })
}

test('the close button has a tooltip from its label', async ({ page }) => {
  await page.goto('/test/one.html')
  await expect(page.getByRole('button', { name: 'Close' })).toHaveAttribute('title', 'Close')
})
