import { test, expect } from "@playwright/test";

const phase = (page, value) =>
  expect(page.locator(".card-field")).toHaveAttribute("data-phase", value);
const card = (page, index) => page.locator(`[data-slot="${index}"] button`);
const reader = (page) => page.getByRole("dialog");
const story = async (page, title) => {
  await phase(page, "reading");
  await expect(page.locator("#reader-title")).toHaveText(title);
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.observedPhases = [];
    new MutationObserver(() => {
      const value = document.querySelector(".card-field")?.dataset.phase;
      if (value && window.observedPhases.at(-1) !== value)
        window.observedPhases.push(value);
      if (value === "inserting" && !window.frontEntry) {
        const port = document.querySelector(".bmo-port");
        const card = document.querySelector(".flying-cartridge");
        if (port && card) {
          const target = new DOMPoint(584, 714).matrixTransform(
            port.getScreenCTM(),
          );
          const bounds = card.getBoundingClientRect();
          window.frontEntry = {
            portY: target.y,
            cardCenterY: bounds.y + bounds.height / 2,
          };
        }
      }
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
  await story(page, "Gelecek sandığından daha yakın.");
  expect(await page.evaluate(() => window.observedPhases)).toEqual([
    "idle",
    "approaching",
    "inserting",
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
  await story(page, "Biraz renk, biraz macera.");
  const phases = await page.evaluate(() => window.observedPhases);
  expect(phases.slice(-7)).toEqual([
    "zoomingOut",
    "ejecting",
    "returning",
    "approaching",
    "inserting",
    "zooming",
    "reading",
  ]);
  await page.getByRole("button", { name: "SONRAKİ KART", exact: true }).click();
  await story(page, "Gelecek sandığından daha yakın.");
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
  await story(page, "Altınlar nereye gidiyor?");
  await expect(page.locator(".is-away")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Haberi kapat ve kartı çıkar" })
    .click();
  await phase(page, "idle");
  await card(page, 1).press("ArrowRight");
  await story(page, "Krallıkta gündem değişiyor.");
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
  await story(page, "Macera için hava nasıl?");
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
    await story(page, "Gelecek sandığından daha yakın.");
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
  await story(page, "Krallıkta gündem değişiyor.");
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
  await story(page, "Krallıkta gündem değişiyor.");
  await page.keyboard.press("Escape");
  await phase(page, "idle");
});

test("card enters from the lower front and starts zooming immediately after insertion", async ({
  page,
}) => {
  await page.goto("/");
  await card(page, 1).click({ force: true });
  await phase(page, "zooming");
  const front = await page.evaluate(() => window.frontEntry);
  expect(front.cardCenterY).toBeGreaterThan(front.portY);
  await expect(page.locator(".happy-bmo-face")).toHaveAttribute(
    "data-expression", "woohoo",
  );
  await expect(page.locator(".screen-scroll")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator(".screen-scroll")).toHaveAttribute("inert", "");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.activeElement.matches(".news-reader")),
  ).toBe(true);
  await story(page, "Altınlar nereye gidiyor?");
  expect(await page.evaluate(() => window.observedPhases)).toEqual([
    "idle",
    "approaching",
    "inserting",
    "zooming",
    "reading",
  ]);
  await expect(page.locator(".screen-scroll")).not.toHaveAttribute("inert", "");
  await expect(page.locator(".screen-scroll")).toHaveCSS("overflow-y", "auto");
  await page.keyboard.press("Escape");
  await phase(page, "zoomingOut");
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

for (const [width, index, expression] of [[1440, 0, "play"], [390, 4, "yay"]]) {
  test(`whole scene moves into BMO's happy screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await card(page, index).click({ force: true });
    await phase(page, "approaching");
    await expect(page.locator(".happy-bmo-face")).toHaveAttribute("data-expression", "smile");
    await phase(page, "inserting");
    await expect(page.locator(".happy-bmo-face")).toHaveAttribute("data-expression", expression);
    await expect(page.locator(".bmo-screen-reaction text")).toHaveCount(0);
    await phase(page, "zooming");
    const frames = await page.evaluate(() => new Promise(resolve => {
      const samples = [];
      function sample() {
        const camera = document.querySelector(".scene-camera");
        const matrix = new DOMMatrix(getComputedStyle(camera).transform);
        const svg = document.querySelector(".bmo-port");
        const slope = Math.tan(-8 * Math.PI / 180);
        const center = new DOMPoint(658, 492.5 + slope * 223).matrixTransform(svg.getScreenCTM());
        samples.push({
          scale: matrix.a, shear: matrix.b, x: center.x, y: center.y,
          plate: Number(getComputedStyle(document.querySelector(".bmo-screen-frame")).opacity),
          content: Number(getComputedStyle(document.querySelector(".screen-scroll")).opacity),
        });
        if (camera.dataset.phase === "reading") resolve(samples);
        else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }));
    expect(frames.length).toBeGreaterThan(8);
    expect(frames.at(-1).scale).toBeGreaterThan(2);
    const destination = frames.at(-1);
    const start = frames[0];
    const startProgress = Math.log(start.scale) / Math.log(destination.scale);
    const originalCenter = {
      x: (start.x - startProgress * width / 2) / (1 - startProgress),
      y: (start.y - startProgress * 422) / (1 - startProgress),
    };
    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index];
      const progress = Math.log(frame.scale) / Math.log(destination.scale);
      // No scene shear or cross-term drift while the camera approaches its aim.
      expect(Math.abs(frame.shear)).toBeLessThan(0.0001);
      expect(Math.abs(frame.x - (originalCenter.x + (width / 2 - originalCenter.x) * progress))).toBeLessThan(1);
      expect(Math.abs(frame.y - (originalCenter.y + (422 - originalCenter.y) * progress))).toBeLessThan(1);
      if (index) expect(frame.scale).toBeGreaterThanOrEqual(frames[index - 1].scale - 0.001);
      // Text can never ghost over the room or the old LCD border.
      if (frame.content > 0.01) expect(frame.plate).toBeGreaterThan(0.99);
    }
    expect(destination.plate).toBe(1);
    expect(destination.content).toBe(1);
    // The article surface stays at viewport size; it never flies out of BMO.
    const surface = await page.locator(".bmo-screen-frame").boundingBox();
    expect(surface).toEqual({ x: 0, y: 0, width, height: 844 });
    await expect(page.locator(".bmo-screen-frame")).toHaveCSS("transform", "none");
    await phase(page, "reading");
    const center = await page.locator(".bmo-port").evaluate(svg => {
      const slope = Math.tan(-8 * Math.PI / 180);
      const point = new DOMPoint(658, 492.5 + slope * 223).matrixTransform(svg.getScreenCTM());
      return { x: point.x, y: point.y };
    });
    expect(center.x).toBeCloseTo(width / 2, 0);
    expect(center.y).toBeCloseTo(422, 0);
    await page.keyboard.press("Escape");
    await phase(page, "idle");
    await expect(page.locator(".scene-camera")).toHaveCSS("transform", "none");
    await expect(card(page, index)).toBeFocused();
  });
}

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
