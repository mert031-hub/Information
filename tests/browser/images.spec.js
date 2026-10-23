import { test, expect } from "@playwright/test";

for (const [name, viewport] of [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1440, height: 1000 }],
]) {
  test(`${name}: responsive images are sharp without downloading article covers on first load`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    const responses = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "image")
        responses.push(response);
    });
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page
      .locator(".room-background img, .bmo-character, .cartridge-art img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
    const sizes = await Promise.all(
      responses.map(async (response) => (await response.body()).length),
    );
    const bytes = sizes.reduce((sum, value) => sum + value, 0);
    expect(bytes).toBeLessThan(450 * 1024);
    expect(
      responses.every((response) => !response.url().includes("-article-")),
    ).toBe(true);
    const room = await page
      .locator(".room-background img")
      .evaluate((image) => image.currentSrc);
    expect(room).toContain(
      name === "mobile" ? "roomPortrait-scene-" : "roomLandscape-scene-",
    );
    const thumbs = await page
      .locator(".cartridge-slot .cartridge-art img")
      .evaluateAll((images) => images.map((image) => image.currentSrc));
    expect(thumbs.every((url) => url.includes("-card-"))).toBe(true);
    const bmo = await page
      .locator(".bmo-character")
      .evaluate((image) => image.currentSrc);
    expect(bmo).toContain("bmo-character-");
    console.log(`${name} first-load images: ${(bytes / 1024).toFixed(1)} KiB`);
    await page.locator('[data-slot="2"] button').click({ force: true });
    await expect(page.locator(".card-field")).toHaveAttribute(
      "data-phase",
      "reading",
    );
    const cover = page.locator(".reader-cover img");
    await cover.evaluate((image) => image.decode());
    const source = await cover.evaluate((image) => image.currentSrc);
    expect(source).toContain("politics-article-");
    expect(
      responses
        .filter((response) => response.url().includes("-article-"))
        .every((response) => response.url().includes("politics-article-")),
    ).toBe(true);
    const natural = await cover.evaluate((image) => ({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }));
    expect(natural.width / natural.height).toBeCloseTo(16 / 9, 1);
    await page.keyboard.press("Escape");
    await expect(page.locator(".card-field")).toHaveAttribute(
      "data-phase",
      "idle",
    );
    await context.close();
  });
}
