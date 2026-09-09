import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, { fsCache: false });
const { HERO_MAP_INTRO_MS, heroStoryScenes, getHeroStorySceneIndex, getRemainingMapIntroMs } = await jiti.import("../src/lib/home-hero-story.ts");

test("map intro lasts ten active seconds, with only the remainder after a pause", () => {
  assert.equal(HERO_MAP_INTRO_MS, 10_000);
  assert.equal(getRemainingMapIntroMs(0), 10_000);
  assert.equal(getRemainingMapIntroMs(3_400), 6_600);
  assert.equal(getRemainingMapIntroMs(3_400 + 2_100), 4_500);
  assert.equal(getRemainingMapIntroMs(10_000), 0);
  assert.equal(getRemainingMapIntroMs(10_500), 0);
  assert.equal(getRemainingMapIntroMs(-1), 10_000);
});

test("scene cues match the video sequence and fit its 15-second duration", () => {
  assert.deepEqual(heroStoryScenes.map((scene) => scene.id), ["geography", "delivery", "meat", "beer", "water", "snacks"]);
  assert.equal(heroStoryScenes[0].startsAt, 0);
  for (let index = 0; index < heroStoryScenes.length; index += 1) {
    const scene = heroStoryScenes[index];
    assert.ok(scene.eyebrow && scene.title && scene.text);
    assert.ok(scene.startsAt < 15);
    assert.equal(getHeroStorySceneIndex(scene.startsAt), index);
    if (index > 0) {
      assert.ok(scene.startsAt > heroStoryScenes[index - 1].startsAt);
      assert.equal(getHeroStorySceneIndex(scene.startsAt - 0.001), index - 1);
    }
  }
});

test("captions follow media time when pausing, seeking, buffering and looping", () => {
  for (const [time, expected] of [[0, 0], [6, 2], [6, 2], [12, 4], [3, 1], [14.9, 5], [0, 0], [9, 3]]) {
    assert.equal(getHeroStorySceneIndex(time), expected);
  }
  for (const time of [-5, NaN, Infinity]) assert.equal(getHeroStorySceneIndex(time), 0);
});

test("ambient city lights cover both sides of the world map, separately from routes", async () => {
  const svg = await readFile(new URL("../public/assets/home/hero-city-lights.svg", import.meta.url), "utf8");
  assert.match(svg, /viewBox="0 0 1823 863"/);
  const lights = [...svg.matchAll(/M([\d.]+) ([\d.]+)h\.01/g)].map((match) => [Number(match[1]), Number(match[2])]);
  assert.equal(lights.length, 1283);
  assert.ok(lights.filter(([x]) => x < 1000).length > 400);
  assert.ok(lights.filter(([x]) => x >= 1000).length > 750);
  assert.ok(lights.every(([x, y]) => x >= 0 && x <= 1823 && y >= 0 && y <= 863));
  assert.doesNotMatch(svg, /<image|<script|<foreignObject/);
});
