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

test('a picture is never drawn larger than its own size', async ({ page }) => {
  await page.goto('/test/one.html?small')
  const img = page.locator('.rml-view img')
  await expect(img).toBeVisible()
  expect((await img.boundingBox())!.width).toBeLessThanOrEqual(400)
})

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

test('a click on the picture zooms in there, and another zooms back out', async ({ page }) => {
  await page.goto('/')
  const album = page.locator('#norway')
  await album.scrollIntoViewIfNeeded()
  await album.locator('.rml-gallery-slide:not([aria-hidden])').click()
  const view = page.locator('dialog.rml .rml-view')
  await expect(view.locator('img').first()).toBeVisible()
  await page.waitForTimeout(700)
  const count = await page.locator('dialog.rml .rml-count').textContent()
  const media = view.locator('.rml-media:not([aria-hidden])')
  const box = (await media.boundingBox())!
  await page.mouse.click(box.x + box.width * 0.75, box.y + box.height / 2)
  await page.waitForTimeout(600)
  expect(await media.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(2)
  expect(await page.locator('dialog.rml .rml-count').textContent()).toBe(count)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(600)
  expect(await media.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1, 1)
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

test('pictures cannot be dragged out', async ({ page }) => {
  await page.goto('/')
  const album = page.locator('#norway')
  await album.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const blocked = (selector: string) =>
    page.locator(selector).first().evaluate((el) => {
      const event = new DragEvent('dragstart', { bubbles: true, cancelable: true })
      el.dispatchEvent(event)
      return event.defaultPrevented
    })
  expect(await blocked('#norway .rml-gallery-slide img')).toBe(true)
  await album.locator('.rml-gallery-slide:not([aria-hidden])').click()
  await page.waitForTimeout(900)
  expect(await blocked('dialog.rml .rml-media')).toBe(true)
  expect(await blocked('dialog.rml .rml-thumb img')).toBe(true)
})

// Keys, the wheel and clicks while the picture is still on its way in did
// things to a picture that wasn't there yet.
test('nothing responds while the picture opens', async ({ page }) => {
  await page.goto('/')
  const album = page.locator('#norway')
  await album.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await album.locator('.rml-gallery-slide:not([aria-hidden])').click()
  const dialog = page.locator('dialog.rml')
  await expect(dialog).toHaveAttribute('data-moving')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('+')
  const box = (await dialog.locator('.rml-view').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -400)
  await expect(dialog).not.toHaveAttribute('data-moving')
  await page.waitForTimeout(300)
  await expect(dialog.locator('.rml-count')).toHaveText('1 / 9')
  const transform = await dialog.locator('.rml-media:not([aria-hidden])').evaluate((el) => getComputedStyle(el).transform)
  expect(transform === 'none' || transform.startsWith('matrix(1, 0, 0, 1,')).toBe(true)
})

test('pulling the picture down closes it; a short pull springs back', async ({ page }) => {
  await page.goto('/')
  const album = page.locator('#norway')
  await album.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await album.locator('.rml-gallery-slide:not([aria-hidden])').click()
  const dialog = page.locator('dialog.rml')
  await expect(dialog).not.toHaveAttribute('data-moving')
  const box = (await dialog.locator('.rml-view').boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2

  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy + 50, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.rml-count')).toHaveText('1 / 9')

  await page.mouse.move(cx, cy)
  await page.mouse.down()
  await page.mouse.move(cx, cy + 260, { steps: 12 })
  await page.mouse.up()
  await expect(page.locator('dialog.rml')).toHaveCount(0, { timeout: 3000 })
})
