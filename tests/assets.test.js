import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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

test("large backgrounds and covers have enough source resolution; BMO retains alpha", () => {
  const largest = (group, role) =>
    manifest.images
      .filter((image) => image.group === group && image.role === role)
      .sort((a, b) => b.width - a.width)[0];
  assert.ok(largest("roomLandscape", "scene").width >= 1600);
  assert.ok(largest("roomPortrait", "scene").height >= 1600);
  for (const group of [
    "technology",
    "economy",
    "politics",
    "weather",
    "culture",
  ]) {
    assert.ok(largest(group, "article").width >= 1600);
    assert.ok(largest(group, "card").width <= 600);
  }
  assert.ok(
    manifest.images
      .filter((image) => image.group === "bmo")
      .every((image) => image.alpha),
  );
});
