export function moveSelectIndex(index: number, key: string, count: number) {
  const last = Math.max(0, count - 1);
  if (key === "Home") return 0;
  if (key === "End") return last;
  const delta = { ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10 }[key] ?? 0;
  return Math.max(0, Math.min(last, index + delta));
}

export function findSelectMatch(labels: readonly string[], query: string, current: number) {
  const normalized = query.toLocaleLowerCase("ru");
  const repeated = new Set(normalized).size === 1;
  const prefix = repeated ? normalized[0] : normalized;
  if (!prefix || !labels.length) return current;
  const start = repeated ? current + 1 : current;
  for (let offset = 0; offset < labels.length; offset++) {
    const index = (start + offset + labels.length) % labels.length;
    if (labels[index].toLocaleLowerCase("ru").startsWith(prefix)) return index;
  }
  return current;
}

export function selectPopupPosition(
  rect: { left: number; top: number; bottom: number; width: number },
  viewport: { width: number; height: number },
) {
  const edge = 8, gap = 5;
  const below = Math.max(0, viewport.height - rect.bottom - edge - gap);
  const above = Math.max(0, rect.top - edge - gap);
  const upwards = below < 180 && above > below;
  const width = Math.min(Math.max(rect.width, 200), Math.max(1, viewport.width - edge * 2));
  return {
    left: Math.max(edge, Math.min(rect.left, viewport.width - width - edge)),
    width,
    maxHeight: Math.min(320, upwards ? above : below),
    top: upwards ? undefined : Math.max(edge, rect.bottom + gap),
    bottom: upwards ? Math.max(edge, viewport.height - rect.top + gap) : undefined,
  };
}
