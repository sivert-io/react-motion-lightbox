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
