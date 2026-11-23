// A cache that deliberately returns expired entries, like Next's background
// revalidation path. Tests must prove the public loader enforces its own limit.
const state = globalThis.__genlixTestDataCache ??= { entries: new Map(), invalidations: [] };

export function unstable_cache(load, keyParts, options) {
  return async (...args) => {
    const key = JSON.stringify([keyParts, args]);
    if (state.entries.has(key)) return structuredClone(state.entries.get(key).value);
    const value = await load(...args);
    state.entries.set(key, { value: structuredClone(value), tags: options.tags });
    return value;
  };
}

export function revalidateTag(tag, options) {
  state.invalidations.push({ tag, options });
  for (const [key, entry] of state.entries) if (entry.tags.includes(tag)) state.entries.delete(key);
}
