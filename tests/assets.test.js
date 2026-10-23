import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";

const directory = new URL("../src/assets/optimized/", import.meta.url);
const manifest = JSON.parse(
  fs.readFileSync(new URL("manifest.json", directory)),
);

test("responsive images stay within transfer budgets and use actual WebP files", () => {
  const limits = { scene: 200, character: 120, card: 60, article: 310 };
  let total = 0;
  for (const image of manifest.images) {
    const file = fs.readFileSync(new URL(image.file, directory));
    assert.equal(file.toString("ascii", 0, 4), "RIFF", image.file);
    assert.equal(file.toString("ascii", 8, 12), "WEBP", image.file);
    assert.equal(file.length, image.bytes, image.file);
    assert.ok(
      file.length <= limits[image.role] * 1024,
      `${image.file} exceeds budget`,
    );
    assert.ok(image.width > 0 && image.height > 0);
    total += file.length;
  }
  assert.ok(
    total < 3.5 * 1024 * 1024,
    "all responsive variants fit in 3.5 MiB",
  );
});

test("responsive sources preserve native resolution and BMO retains alpha", () => {
  const largest = (group, role) =>
    manifest.images
      .filter((image) => image.group === group && image.role === role)
      .sort((a, b) => b.width - a.width)[0];
  assert.ok(largest("roomLandscape", "scene").width >= 1600);
  assert.ok(largest("roomPortrait", "scene").height >= 1600);
  for (const group of [
    "technology",
    "politics",
    "weather",
    "culture",
  ]) {
    assert.ok(largest(group, "article").width >= 1600);
    assert.ok(largest(group, "card").width <= 600);
  }
  const original = fs.readFileSync(
    new URL("../Photos/haberkapak3.jpg", import.meta.url),
  );
  const economy = manifest.sources.economy;
  assert.equal(economy.file, "Photos/haberkapak3.jpg");
  assert.equal(
    economy.sha256,
    createHash("sha256").update(original).digest("hex"),
  );
  assert.equal(largest("economy", "article").width, economy.width);
  assert.ok(
    manifest.images
      .filter(image => image.group === "economy")
      .every(image => image.width <= economy.width && image.height <= economy.height),
  );
  assert.ok(
    manifest.images
      .filter((image) => image.group === "bmo")
      .every((image) => image.alpha),
  );
});
