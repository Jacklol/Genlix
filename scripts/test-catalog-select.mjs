import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { createJiti } = createRequire(require.resolve("eslint/package.json"))("jiti");
const jiti = createJiti(import.meta.url, { fsCache: false });
const { moveSelectIndex, findSelectMatch, selectPopupPosition } = await jiti.import("../src/lib/catalog/select-navigation.ts");

test("keyboard navigation clamps to options and supports Home/End/Page keys", () => {
  for (const [index, key, expected] of [
    [0, "ArrowUp", 0], [2, "ArrowDown", 3], [19, "ArrowDown", 19],
    [5, "Home", 0], [5, "End", 19], [5, "PageDown", 15],
    [15, "PageDown", 19], [15, "PageUp", 5], [5, "PageUp", 0],
  ]) assert.equal(moveSelectIndex(index, key, 20), expected);
  assert.equal(moveSelectIndex(0, "ArrowDown", 1), 0);
  assert.equal(moveSelectIndex(0, "End", 0), 0);
});

test("typeahead matches Russian and Latin labels without changing the committed value", () => {
  const labels = ["Все", "Говядина", "Голень", "Курица", "Paulaner", "Pilsner Urquell"];
  assert.equal(findSelectMatch(labels, "Г", 0), 1);
  assert.equal(findSelectMatch(labels, "гов", 1), 1);
  assert.equal(findSelectMatch(labels, "гол", 1), 2);
  assert.equal(findSelectMatch(labels, "pa", 0), 4);
  assert.equal(findSelectMatch(labels, "PI", 4), 5);
  assert.equal(findSelectMatch(labels, "нет", 3), 3);
  assert.equal(findSelectMatch(labels, "", 3), 3);
  assert.equal(findSelectMatch([], "а", 0), 0);
});

test("repeated letters cycle through matching options and wrap", () => {
  const labels = ["Все", "Paulaner", "Pilsner Urquell"];
  assert.equal(findSelectMatch(labels, "p", 0), 1);
  assert.equal(findSelectMatch(labels, "pp", 1), 2);
  assert.equal(findSelectMatch(labels, "ppp", 2), 1);
});

test("popup opens below with bounded height when there is room", () => {
  assert.deepEqual(selectPopupPosition({ left: 100, top: 250, bottom: 286, width: 240 }, { width: 1440, height: 900 }), {
    left: 100, width: 240, maxHeight: 320, top: 291, bottom: undefined,
  });
});

test("popup opens upwards near the viewport bottom", () => {
  const popup = selectPopupPosition({ left: 100, top: 820, bottom: 856, width: 240 }, { width: 1440, height: 900 });
  assert.equal(popup.bottom, 85);
  assert.equal(popup.top, undefined);
  assert.equal(popup.maxHeight, 320);
});

test("popup stays inside narrow screens and near the horizontal edges", () => {
  for (const width of [150, 320, 375, 1440]) {
    for (const left of [-100, 0, width - 80]) {
      const popup = selectPopupPosition({ left, top: 150, bottom: 194, width: 288 }, { width, height: 300 });
      assert.ok(popup.left >= 8);
      assert.ok(popup.left + popup.width <= width - 8);
      assert.ok(popup.maxHeight > 0 && popup.maxHeight <= 320);
      if (popup.top !== undefined) assert.ok(popup.top + popup.maxHeight <= 292);
      if (popup.bottom !== undefined) assert.ok(popup.bottom + popup.maxHeight <= 292);
    }
  }
});
