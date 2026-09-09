"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { findSelectMatch, moveSelectIndex, selectPopupPosition } from "@/lib/catalog/select-navigation";
import styles from "./CatalogSelect.module.css";

type SelectOption = { value: string; label: string };
type CatalogSelectProps = {
  id?: string;
  label: string;
  value?: string;
  options: readonly SelectOption[];
  emptyLabel?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

/** Select-only combobox: focus stays on the trigger, navigation doesn't commit
 * until Enter/Space/Tab or an option click; Escape cancels the pending choice. */
export function CatalogSelect({ id, label, value = "", options, emptyLabel = "Все", disabled = false, onChange }: CatalogSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `catalog-select-${generatedId}`;
  const listId = `${triggerId}-listbox`;
  const items = [{ value: "", label: emptyLabel }, ...options.filter((option) => option.value !== "")];
  const selectedIndex = Math.max(0, items.findIndex((item) => item.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [position, setPosition] = useState<ReturnType<typeof selectPopupPosition>>();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef({ query: "", time: 0 });
  const active = Math.min(activeIndex, items.length - 1);
  const expanded = open && !disabled;

  function openList(index = selectedIndex) {
    if (disabled || !trigger.current) return;
    setPosition(selectPopupPosition(trigger.current.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }));
    setActiveIndex(index);
    setOpen(true);
  }
  const closeList = useCallback(() => {
    setOpen(false);
    search.current = { query: "", time: 0 };
  }, []);
  function choose(index: number, restoreFocus = true) {
    closeList();
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
    if (items[index] && items[index].value !== value) onChange(items[index].value);
  }

  useEffect(() => {
    if (!expanded) return;
    function reposition(event?: Event) {
      // Scrolling inside the popup must not reposition or close it.
      if (event?.target instanceof Node && list.current?.contains(event.target)) return;
      const element = trigger.current;
      const rect = element?.getBoundingClientRect();
      if (!element?.getClientRects().length || !rect || rect.bottom < 0 || rect.top > window.innerHeight) {
        closeList();
        return;
      }
      const next = selectPopupPosition(rect, { width: window.innerWidth, height: window.innerHeight });
      setPosition((previous) => previous && Object.keys(next).every((key) => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !list.current?.contains(event.target)) closeList();
    }
    const observer = new ResizeObserver(() => reposition());
    if (trigger.current) observer.observe(trigger.current);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [expanded, closeList]);

  useEffect(() => {
    if (!expanded) return;
    const option = list.current?.children[active] as HTMLElement | undefined;
    const container = list.current;
    if (!option || !container) return;
    const top = option.offsetTop, bottom = top + option.offsetHeight;
    if (top < container.scrollTop) container.scrollTop = top;
    else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight;
  }, [active, expanded]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled || event.ctrlKey || event.metaKey) return;
    if (event.key === "Escape") {
      if (expanded) { event.preventDefault(); event.stopPropagation(); closeList(); }
      return;
    }
    if (event.key === "Tab") { if (expanded) choose(active, false); return; }
    if (event.altKey && event.key === "ArrowUp") {
      if (expanded) { event.preventDefault(); choose(active); }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (expanded) choose(active); else openList();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End", "PageDown", "PageUp"].includes(event.key)) {
      event.preventDefault();
      if (expanded) setActiveIndex(moveSelectIndex(active, event.key, items.length));
      else openList(event.key === "Home" || event.key === "ArrowUp" ? 0 : event.key === "End" ? items.length - 1 : selectedIndex);
      return;
    }
    if (!event.altKey && event.key.length === 1) {
      event.preventDefault();
      const now = Date.now();
      const query = now - search.current.time < 700 ? search.current.query + event.key : event.key;
      search.current = { query, time: now };
      const match = findSelectMatch(items.map((item) => item.label), query, expanded ? active : selectedIndex);
      if (expanded) setActiveIndex(match); else openList(match);
    }
  }

  return <>
    <button ref={trigger} id={triggerId} type="button" role="combobox" aria-label={label}
      aria-expanded={expanded} aria-controls={expanded ? listId : undefined} aria-haspopup="listbox"
      aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
      disabled={disabled} className={styles.trigger} data-open={expanded || undefined}
      onKeyDown={handleKeyDown} onClick={() => { if (expanded) closeList(); else openList(); }}
      onBlur={(event) => { if (!list.current?.contains(event.relatedTarget)) closeList(); }}>
      <span className={styles.value}>{items[selectedIndex].label}</span>
      <svg className={styles.chevron} aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {expanded && position ? createPortal(
      <div ref={list} id={listId} role="listbox" aria-label={label} className={styles.list} style={position}
        onMouseDown={(event) => event.preventDefault()}>
        {items.map((option, index) => <div key={option.value} id={`${listId}-${index}`} role="option"
          aria-selected={index === selectedIndex} className={styles.option} data-active={index === active || undefined}
          onPointerMove={(event) => { if (event.pointerType === "mouse") setActiveIndex(index); }}
          onClick={(event) => { event.stopPropagation(); choose(index); }}>
          <span>{option.label}</span>
          {index === selectedIndex ? <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg> : null}
        </div>)}
      </div>, document.body,
    ) : null}
  </>;
}
