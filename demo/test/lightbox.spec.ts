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

test('the wheel zooms the picture without scrolling the page', async ({ page }) => {
  await page.goto('/')
  const album = page.locator('#norway')
  await album.scrollIntoViewIfNeeded()
  await album.locator('.rml-gallery-slide:not([aria-hidden])').click()
  const view = page.locator('dialog.rml .rml-view')
  await expect(view.locator('img').first()).toBeVisible()
  await page.waitForTimeout(700)
  const before = await page.evaluate(() => scrollY)
  const box = (await view.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -400)
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => scrollY)).toBe(before)
  const scale = await view.locator('.rml-media:not([aria-hidden])').evaluate((el) => getComputedStyle(el).transform)
  expect(scale).not.toBe('none')
})

// The frame's copy for wrapping round from the last thumbnail to the first
// sat one row-length to the left, and since the frame was drawn outside the
// thumbnail it poked into the first one: two frames at once (Gryt, 0.2.0).
test('only the current thumbnail is framed', async ({ page }) => {
  await page.goto('/test/one.html?n=2')
  await expect(page.locator('.rml-thumb')).toHaveCount(2)
  await page.waitForTimeout(500)
  const shown = await page.locator('.rml-thumb-frame').evaluateAll((frames) => {
    const row = frames[0].closest('.rml-thumbs')!.getBoundingClientRect()
    return frames.filter((f) => {
      const r = f.getBoundingClientRect()
      return getComputedStyle(f).opacity !== '0' && r.right > row.left + 1 && r.left < row.right - 1
    }).length
  })
  expect(shown).toBe(1)
})
