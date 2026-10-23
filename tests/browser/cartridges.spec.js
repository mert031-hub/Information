import { test, expect } from "@playwright/test";

const phase = (page, value) =>
  expect(page.locator(".card-field")).toHaveAttribute("data-phase", value);
const card = (page, index) => page.locator(`[data-slot="${index}"] button`);
const reader = (page) => page.getByRole("dialog");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.observedPhases = [];
    new MutationObserver(() => {
      const value = document.querySelector(".card-field")?.dataset.phase;
      if (value && window.observedPhases.at(-1) !== value)
        window.observedPhases.push(value);
    }).observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["data-phase"],
    });
  });
});

test("inserts, reads, switches with ejection, wraps and returns keyboard focus", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await card(page, 0).click({ force: true });
  await expect(reader(page)).toBeVisible();
  await expect(page.locator("#reader-title")).toHaveText(
    "Gelecek sandığından daha yakın.",
  );
  expect(await page.evaluate(() => window.observedPhases)).toEqual([
    "idle",
    "approaching",
    "inserting",
    "loading",
    "reading",
  ]);
  await expect(page.locator(".is-away")).toHaveAttribute("data-slot", "0");
  for (let tab = 0; tab < 8; tab++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        Boolean(document.activeElement.closest(".news-reader")),
      ),
    ).toBe(true);
  }
  await page.getByRole("button", { name: "ÖNCEKİ KART", exact: true }).click();
  await expect(reader(page)).toBeVisible();
  await expect(page.locator("#reader-title")).toHaveText(
    "Biraz renk, biraz macera.",
  );
  const phases = await page.evaluate(() => window.observedPhases);
  expect(phases.slice(-6)).toEqual([
    "ejecting",
    "returning",
    "approaching",
    "inserting",
    "loading",
    "reading",
  ]);
  await page.getByRole("button", { name: "SONRAKİ KART", exact: true }).click();
  await expect(page.locator("#reader-title")).toHaveText(
    "Gelecek sandığından daha yakın.",
  );
  await page.keyboard.press("Escape");
  await phase(page, "idle");
  await expect(card(page, 0)).toBeFocused();
  await expect(page.locator(".is-away")).toHaveCount(0);
  await expect(page.locator(".flight-mask")).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  expect(errors).toEqual([]);
});

test("rapid clicks are ignored while the selected cartridge is moving", async ({
  page,
}) => {
  await page.goto("/");
  await card(page, 1).click({ force: true });
  await page
    .locator('[data-slot="4"] button')
    .evaluate((button) => button.click());
  await page
    .locator('[data-slot="2"] button')
    .evaluate((button) => button.click());
  await expect(page.locator("#reader-title")).toHaveText(
    "Altınlar nereye gidiyor?",
  );
  await expect(page.locator(".is-away")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Haberi kapat ve kartı çıkar" })
    .click();
  await phase(page, "idle");
  await card(page, 1).press("ArrowRight");
  await expect(page.locator("#reader-title")).toHaveText(
    "Krallıkta gündem değişiyor.",
  );
});

test("five hover melodies reach native Web Audio; mute cancels even scheduled notes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.audioProbe = {
      contexts: [],
      frequencies: [],
      gains: [],
      cancellations: 0,
    };
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        window.audioProbe.contexts.push(this);
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        const set = oscillator.frequency.setValueAtTime.bind(
          oscillator.frequency,
        );
        oscillator.frequency.setValueAtTime = (value, time) => {
          window.audioProbe.frequencies.push(value);
          return set(value, time);
        };
        const stop = oscillator.stop.bind(oscillator);
        oscillator.stop = (...args) => {
          if (args.length === 0) window.audioProbe.cancellations++;
          return stop(...args);
        };
        return oscillator;
      }
      createGain() {
        const gain = super.createGain();
        window.audioProbe.gains.push(gain);
        return gain;
      }
    };
  });
  await page.goto("/");
  const sound = page.getByRole("button", {
    name: "Ses efektleri",
    exact: true,
  });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await page.waitForFunction(
    () => window.audioProbe.contexts[0]?.state === "running",
  );
  const expectedNotes = [
    [880, 1320],
    [523.25, 783.99, 1046.5],
    [293.66, 440],
    [783.99, 987.77, 1174.66],
    [659.25, 830.61, 987.77],
  ];
  for (let index = 0; index < 5; index++) {
    await page.mouse.move(10, 10);
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      window.audioProbe.frequencies = [];
    });
    await card(page, index).hover({ force: true });
    expect(await page.evaluate(() => window.audioProbe.frequencies)).toEqual(
      expectedNotes[index],
    );
  }
  await sound.click();
  expect(await page.evaluate(() => window.audioProbe.gains[0].gain.value)).toBe(
    0,
  );
  expect(
    await page.evaluate(() => window.audioProbe.cancellations),
  ).toBeGreaterThan(0);
  await page.evaluate(() => {
    window.audioProbe.frequencies = [];
  });
  await card(page, 0).hover({ force: true });
  expect(await page.evaluate(() => window.audioProbe.frequencies)).toEqual([]);
  await sound.click();
  await card(page, 0).click({ force: true });
  await expect(reader(page)).toBeVisible();
  expect(await page.evaluate(() => window.audioProbe.frequencies)).toContain(
    180,
  );
  const modalSound = reader(page).getByRole("button", {
    name: "Ses efektleri",
    exact: true,
  });
  await modalSound.click();
  expect(await page.evaluate(() => window.audioProbe.gains[0].gain.value)).toBe(
    0,
  );
  await page.reload();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await page.reload();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await page.waitForFunction(
    () => window.audioProbe.contexts[0]?.state === "running",
  );
  await card(page, 0).hover({ force: true });
  expect(await page.evaluate(() => window.audioProbe.frequencies)).toEqual([
    880, 1320,
  ]);
});

test("reduced motion still opens and closes stories without a moving flight", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await card(page, 3).click();
  await expect(page.locator("#reader-title")).toHaveText(
    "Macera için hava nasıl?",
  );
  await expect(page.locator(".news-reader")).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.keyboard.press("Escape");
  await phase(page, "idle");
  await expect(card(page, 3)).toBeFocused();
  await expect(card(page, 3)).toHaveCSS("animation-name", "none");
});

for (const width of [320, 390, 768]) {
  test(`reader and cartridge transitions work at ${width}px without horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await card(page, 4).click({ force: true });
    await expect(reader(page)).toBeVisible();
    expect(
      await reader(page).evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    const bounds = await reader(page).boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    await page
      .getByRole("button", { name: "SONRAKİ KART", exact: true })
      .click();
    await expect(page.locator("#reader-title")).toHaveText(
      "Gelecek sandığından daha yakın.",
    );
    await page
      .getByRole("button", { name: "Haberi kapat ve kartı çıkar" })
      .click();
    await phase(page, "idle");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("resizing during insertion recomputes the port position and completes", async ({
  page,
}) => {
  await page.goto("/");
  await card(page, 2).click({ force: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#reader-title")).toHaveText(
    "Krallıkta gündem değişiyor.",
  );
  await page.keyboard.press("Escape");
  await phase(page, "idle");
});

test("unavailable audio and blocked storage do not prevent reading", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ses efektleri", exact: true })
    .click();
  await card(page, 2).click({ force: true });
  await expect(page.locator("#reader-title")).toHaveText(
    "Krallıkta gündem değişiyor.",
  );
  await page.keyboard.press("Escape");
  await phase(page, "idle");
});
