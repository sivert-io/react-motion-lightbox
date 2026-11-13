import { expect, test } from '@playwright/test'

// Each slide's item and its place on the track, in steps from the box's left edge.
const places = (page: import('@playwright/test').Page) =>
  page.locator('.rml-gallery-box').evaluate((box) => {
    const left = box.getBoundingClientRect().left
    const step = box.clientWidth - 50 + 10
    return [...box.querySelectorAll<HTMLElement>('.rml-gallery-slide')]
      .map((el) => [Math.round((el.getBoundingClientRect().left - left) / step), Number(el.dataset.index)])
      .sort((a, b) => a[0] - b[0])
  })

// With 2 or 3 photos the one after next is already drawn as the one before or
// the current one. It was left out, so the peek stayed empty while the next one
// glided in, and the photo popped in once it landed.
for (const n of [2, 3, 5]) {
  test(`with ${n} photos and a peek, the one after next is in place before a move`, async ({ page }) => {
    await page.goto(`/test/gallery.html?n=${n}`)
    await expect(page.locator('.rml-count')).toHaveText(`1 / ${n}`)
    expect(await places(page)).toEqual([[-1, n - 1], [0, 0], [1, 1], [2, 2 % n]])
    // Mid-glide the places are the same: the next one isn't current until it lands.
    await page.getByRole('button', { name: 'Next' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.rml-count')).toHaveText(`1 / ${n}`)
    const glide = await places(page)
    expect(glide.map(([, i]) => i)).toEqual([n - 1, 0, 1, 2 % n])
    await expect(page.locator('.rml-count')).toHaveText(`2 / ${n}`)
    await page.waitForTimeout(200)
    expect(await places(page)).toEqual([[-1, 0], [0, 1], [1, 2 % n], [2, 3 % n]])
  })
}

test('shown in full on either side, two photos each way are drawn, copies and all', async ({ page }) => {
  await page.goto('/test/gallery.html?n=2&wide')
  await expect(page.locator('.rml-count')).toHaveText('1 / 2')
  expect(await places(page)).toEqual([[-2, 0], [-1, 1], [0, 0], [1, 1], [2, 0]])
})

// Each slide's left and right edge and its item, left to right, relative to the box.
const edges = (page: import('@playwright/test').Page) =>
  page.locator('.rml-gallery-box').evaluate((box) => {
    const b = box.getBoundingClientRect()
    return [...box.querySelectorAll<HTMLElement>('.rml-gallery-slide')]
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { i: Number(el.dataset.index), l: r.left - b.left, r: r.right - b.left, w: b.width }
      })
      .sort((a, c) => a.l - c.l)
  })

// Wide and tall photos at their own widths: the gap between each pair is the
// same, and whichever is current sits in the middle of the box.
test('with natural widths, every gap is the same and the current photo is centred', async ({ page }) => {
  await page.goto('/test/gallery.html?n=6&natural&wide')
  const check = async (current: number) => {
    const slides = await edges(page)
    const widths = new Set(slides.map((s) => Math.round(s.r - s.l)))
    expect(widths.size).toBeGreaterThan(1)
    for (let k = 1; k < slides.length; k++) expect(slides[k].l - slides[k - 1].r).toBeCloseTo(10, 0)
    const mid = slides.find((s) => s.i === current && Math.abs((s.l + s.r) / 2 - s.w / 2) < 1)
    expect(mid).toBeTruthy()
  }
  await expect(page.locator('.rml-count')).toHaveText('1 / 6')
  await check(0)
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('.rml-count')).toHaveText('2 / 6')
  await page.waitForTimeout(200)
  await check(1)
  // A drag left lands the next one in the middle too.
  const box = (await page.locator('.rml-gallery-box').boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 - 200, box.y + box.height / 2, { steps: 10 })
  await page.mouse.up()
  await expect(page.locator('.rml-count')).toHaveText('3 / 6')
  await page.waitForTimeout(800)
  await check(2)
})

// The lightbox opens out of, and closes back into, the photo's own slide.
test('with natural widths, the lightbox closes back into the photo it ended on', async ({ page }) => {
  await page.goto('/test/gallery.html?n=6&natural&wide')
  await page.locator('.rml-gallery-slide:not([aria-hidden])').click()
  const dialog = page.locator('dialog.rml')
  await expect(dialog).toHaveAttribute('data-moving')
  await expect(dialog).not.toHaveAttribute('data-moving')
  await page.keyboard.press('ArrowRight')
  await expect(dialog.locator('.rml-count')).toHaveText('2 / 6')
  await page.waitForTimeout(800)
  await page.keyboard.press('Escape')
  await expect(page.locator('.rml-gallery[data-lightbox]')).toHaveCount(0)
  await expect(page.locator('.rml-gallery-foot .rml-count')).toHaveText('2 / 6')
  await page.waitForTimeout(200)
  const slides = await edges(page)
  const mid = slides.find((s) => s.i === 1 && Math.abs((s.l + s.r) / 2 - s.w / 2) < 1)
  expect(mid).toBeTruthy()
})

// Past `maxSlideAspect` a wide photo is cut to the limit and filled, so it is
// as tall as the rest instead of letterboxed, and the gaps stay the same.
test('with a max slide aspect, a wide photo fills a slide cut to the limit', async ({ page }) => {
  await page.goto('/test/gallery.html?n=6&natural&wide&contain&max=1.5')
  await expect(page.locator('.rml-gallery-foot .rml-count')).toHaveText('1 / 6')
  const slides = await edges(page)
  for (let k = 1; k < slides.length; k++) expect(slides[k].l - slides[k - 1].r).toBeCloseTo(10, 0)
  const wide = page.locator('.rml-gallery-slide[data-index="0"]').first()
  const [slide, img] = await wide.evaluate((el) => [el.getBoundingClientRect(), el.querySelector('img')!.getBoundingClientRect()].map((r) => ({ w: r.width, h: r.height })))
  expect(slide.w / slide.h).toBeCloseTo(1.5, 1)
  expect(img.h).toBeGreaterThanOrEqual(slide.h - 1)
  expect(img.w).toBeGreaterThan(slide.w)
  // It opens and closes back into its slide.
  await wide.click()
  const dialog = page.locator('dialog.rml')
  await expect(dialog).not.toHaveAttribute('data-moving')
  await page.keyboard.press('Escape')
  await expect(page.locator('.rml-gallery[data-lightbox]')).toHaveCount(0)
})
