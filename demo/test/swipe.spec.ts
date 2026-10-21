import { expect, test } from '@playwright/test'

// Two quick drags, the second grabbing the album mid-glide. The counter moved
// on, but the photo that joined the track during the move was drawn where the
// track used to be, on top of the current one.
test('quick swipes land on the photo the counter says', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 900 })
  await page.goto('/')
  const album = page.locator('#norway')
  await album.scrollIntoViewIfNeeded()
  const box = (await album.locator('.rml-gallery-box').boundingBox())!
  const y = box.y + box.height / 2
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(box.x + box.width * 0.8, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.3, y, { steps: 4 })
    await page.mouse.up()
    await page.waitForTimeout(120)
  }
  await page.waitForTimeout(1500)
  const count = await album.locator('.rml-count').textContent()
  const current = Number(count!.split('/')[0]) - 1
  const lefts = await album.locator('.rml-gallery-slide').evaluateAll((els) =>
    els.map((el) => [Number((el as HTMLElement).dataset.index), Math.round(el.getBoundingClientRect().left)]),
  )
  // Only the current photo sits in the box; its neighbours are a step away.
  expect(lefts.filter(([, left]) => Math.abs(left - box.x) < 2).map(([i]) => i)).toEqual([current])
})

// The slideshow's timer was set in the gallery's first render, before the box
// was measured, and glided one gap instead of one photo.
test('autoplay moves a whole photo', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const album = page.locator('#norway')
  await album.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  // Away from the gallery, so it isn't held.
  await page.mouse.move(0, 0)
  await expect(album.locator('.rml-count')).toHaveText('2 / 9', { timeout: 9000 })
  await page.waitForTimeout(1200)
  const box = (await album.locator('.rml-gallery-box').boundingBox())!
  const left = await album.locator('.rml-gallery-slide[data-index="1"]').evaluate((el) => el.getBoundingClientRect().left)
  expect(Math.abs(left - box.x)).toBeLessThan(2)
})

// The gallery behind the lightbox moves with it, so it doesn't jump to the
// next picture once the lightbox has landed.
test('the gallery follows the lightbox as it moves', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const album = page.locator('#norway')
  await album.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await album.locator('.rml-gallery-slide:not([aria-hidden])').click()
  await page.waitForTimeout(900)
  const box = (await album.locator('.rml-gallery-box').boundingBox())!
  const at = () => album.locator('.rml-gallery-slide[data-index="1"]').evaluate((el) => el.getBoundingClientRect().left)
  const before = await at()
  await page.locator('dialog.rml').getByRole('button', { name: 'Next' }).click()
  await page.waitForTimeout(250)
  const mid = await at()
  // Partway: it has started moving, and not yet arrived.
  expect(mid).toBeLessThan(before - 20)
  expect(mid).toBeGreaterThan(box.x + 20)
  await page.waitForTimeout(800)
  expect(Math.abs((await at()) - box.x)).toBeLessThan(2)
  await expect(album.locator('.rml-count')).toHaveText('2 / 9')
})
