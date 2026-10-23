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
