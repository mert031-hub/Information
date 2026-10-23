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
    "celebrating",
    "zooming",
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
  expect(phases.slice(-9)).toEqual([
    "zoomingOut",
    "ejecting",
    "returning",
    "approaching",
    "inserting",
    "loading",
    "celebrating",
    "zooming",
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
    await phase(page, "reading");
    await expect(reader(page)).toBeVisible();
    expect(
      await reader(page).evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    const bounds = await page.locator(".bmo-screen-frame").boundingBox();
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

test("BMO celebrates before the camera enters the screen, then reverses the camera on exit", async ({
  page,
}) => {
  await page.goto("/");
  await card(page, 1).click({ force: true });
  await phase(page, "celebrating");
  await expect(page.locator(".bmo-screen-reaction text")).toHaveText(
    "UWHUUUU!",
  );
  await phase(page, "zooming");
  await expect(page.locator(".screen-boot")).toBeVisible();
  await expect(page.locator("#reader-title")).toHaveCount(0);
  await phase(page, "reading");
  await expect(page.locator(".bmo-screen-glass #reader-title")).toHaveText(
    "Altınlar nereye gidiyor?",
  );
  await expect(page.locator(".screen-scroll")).toHaveCSS("overflow-y", "auto");
  await page.keyboard.press("Escape");
  await phase(page, "zoomingOut");
  await expect(page.locator(".screen-boot")).toBeVisible();
  await phase(page, "idle");
  await expect(reader(page)).toHaveCount(0);
});

test("camera follows a viewport resize during zoom and reading stays inside the LCD frame", async ({
  page,
}) => {
  await page.goto("/");
  await card(page, 0).click({ force: true });
  await phase(page, "zooming");
  await page.setViewportSize({ width: 390, height: 844 });
  await phase(page, "reading");
  const bounds = await page.locator(".bmo-screen-frame").boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
  expect(
    await page
      .locator(".screen-scroll")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await page
    .getByRole("button", { name: "Haberi kapat ve kartı çıkar" })
    .click();
  await phase(page, "idle");
});

test("local speech uses a playful pitch, avoids remote voices and is cancelled by mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.speechProbe = { lines: [], cancellations: 0 };
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: class {
        constructor(text) {
          this.text = text;
        }
      },
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [
          { name: "Remote", lang: "en-US", localService: false },
          { name: "Local", lang: "en-US", localService: true },
        ],
        speak: (line) =>
          window.speechProbe.lines.push({
            text: line.text,
            voice: line.voice.name,
            pitch: line.pitch,
          }),
        cancel: () => {
          window.speechProbe.cancellations++;
        },
      },
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ses efektleri", exact: true })
    .click();
  await card(page, 0).click({ force: true });
  await phase(page, "reading");
  expect(await page.evaluate(() => window.speechProbe.lines)).toEqual([
    { text: "Let's play!", voice: "Local", pitch: 1.7 },
  ]);
  await reader(page)
    .getByRole("button", { name: "Ses efektleri", exact: true })
    .click();
  expect(await page.evaluate(() => window.speechProbe.cancellations)).toBe(1);
  await page.keyboard.press("Escape");
  await phase(page, "idle");
  await card(page, 1).click({ force: true });
  await phase(page, "reading");
  expect(await page.evaluate(() => window.speechProbe.lines.length)).toBe(1);
});
