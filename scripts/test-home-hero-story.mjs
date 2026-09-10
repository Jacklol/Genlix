import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, { fsCache: false });
const { HERO_MAP_INTRO_MS, HERO_VIDEO_TRIM_SECONDS, HERO_STORY_VIDEO_SRC, heroMapScene, heroStoryScenes, getHeroStorySceneIndex, getRemainingMapIntroMs, getGrowingRouteDelayMs } = await jiti.import("../src/lib/home-hero-story.ts");

test("journey routes grow from three to seventeen during the map intro", () => {
  const delays = Array.from({ length: 17 }, (_, index) => getGrowingRouteDelayMs(index));
  assert.deepEqual(delays, [0, 0, 0, 1800, 1800, 1800, 3500, 3500, 3500, 5200, 5200, 5200, 5200, 6900, 6900, 6900, 6900]);
  for (const [elapsed, count] of [[0, 3], [1799, 3], [1800, 6], [3500, 9], [5200, 13], [6900, 17]]) {
    assert.equal(delays.filter((delay) => delay <= elapsed).length, count);
  }
  // Even the last group finishes drawing and starts its deliveries before video.
  assert.ok(Math.max(...delays) + 1100 < HERO_MAP_INTRO_MS);
});

test("map intro lasts ten active seconds, with only the remainder after a pause", () => {
  assert.equal(HERO_MAP_INTRO_MS, 10_000);
  assert.equal(getRemainingMapIntroMs(0), 10_000);
  assert.equal(getRemainingMapIntroMs(3_400), 6_600);
  assert.equal(getRemainingMapIntroMs(3_400 + 2_100), 4_500);
  assert.equal(getRemainingMapIntroMs(10_000), 0);
  assert.equal(getRemainingMapIntroMs(10_500), 0);
  assert.equal(getRemainingMapIntroMs(-1), 10_000);
});

test("trimmed video starts with delivery and keeps the animated map separate", () => {
  assert.equal(heroMapScene.id, "geography");
  assert.equal(HERO_VIDEO_TRIM_SECONDS, 59 / 24);
  assert.equal(HERO_STORY_VIDEO_SRC, "/assets/home/hero-video-story.mp4");
  assert.deepEqual(heroStoryScenes.map((scene) => scene.id), ["delivery", "meat", "beer", "water", "snacks"]);
  assert.equal(heroStoryScenes[0].startsAt, 0);
  assert.deepEqual(heroStoryScenes.slice(1).map((scene) => scene.startsAt), [5.5, 8.1, 11.2, 13.5].map((time) => time - HERO_VIDEO_TRIM_SECONDS));
  for (let index = 0; index < heroStoryScenes.length; index += 1) {
    const scene = heroStoryScenes[index];
    assert.ok(scene.eyebrow && scene.title && scene.text);
    assert.ok(scene.startsAt < 15 - HERO_VIDEO_TRIM_SECONDS);
    assert.equal(getHeroStorySceneIndex(scene.startsAt), index);
    if (index > 0) {
      assert.ok(scene.startsAt > heroStoryScenes[index - 1].startsAt);
      assert.equal(getHeroStorySceneIndex(scene.startsAt - 0.001), index - 1);
    }
  }
});

test("captions follow media time when pausing, seeking, buffering and looping", () => {
  for (const [time, expected] of [[0, 0], [6, 2], [6, 2], [12, 4], [3.1, 1], [12.5, 4], [0, 0], [9, 3]]) {
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
