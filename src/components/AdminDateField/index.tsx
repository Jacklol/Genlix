"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  calendarDayLabel, calendarDays, calendarMonth, calendarWeekday, formatCalendarInput,
  isCalendarDate, localToday, moveCalendarDay, moveCalendarMonth, parseCalendarInput,
} from "@/lib/admin/calendar";
import adminStyles from "@/app/genlix-admin/admin.module.css";
import styles from "./AdminDateField.module.css";

const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function AdminDateField({ name, label, initialValue, required = false, onChange }: {
  name: string; label: string; initialValue: string; required?: boolean; onChange?: () => void;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const focusDay = useRef(false);
  const [text, setText] = useState(() => formatCalendarInput(initialValue));
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ above: false, maxHeight: 400 });
  const [today, setToday] = useState("");
  const [focused, setFocused] = useState(isCalendarDate(initialValue) ? initialValue : "2000-01-01");
  const [month, setMonth] = useState(() => calendarMonth(focused));
  const value = parseCalendarInput(text);
  const days = calendarDays(month);
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;

  const positionPopup = useCallback(() => {
    const box = input.current?.getBoundingClientRect();
    if (!box) return;
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
    const below = Math.max(0, viewportBottom - box.bottom - 12);
    const above = Math.max(0, box.top - viewportTop - 12);
    const height = popup.current ? popup.current.scrollHeight + 2 : 380;
    const openAbove = below < height && above > below;
    const next = { above: openAbove, maxHeight: Math.floor(openAbove ? above : below) };
    setPosition((previous) => previous.above === next.above && previous.maxHeight === next.maxHeight ? previous : next);
  }, []);

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    const observer = new ResizeObserver(positionPopup);
    if (input.current) observer.observe(input.current);
    window.addEventListener("resize", positionPopup);
    window.addEventListener("scroll", positionPopup, true);
    window.visualViewport?.addEventListener("resize", positionPopup);
    document.addEventListener("pointerdown", outside);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", positionPopup);
      window.removeEventListener("scroll", positionPopup, true);
      window.visualViewport?.removeEventListener("resize", positionPopup);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, positionPopup]);

  useEffect(() => {
    if (!open || !focusDay.current) return;
    const container = popup.current;
    const day = container?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`);
    day?.focus({ preventScroll: true });
    if (container && day) {
      if (day.offsetTop < container.scrollTop) container.scrollTop = day.offsetTop;
      else if (day.offsetTop + day.offsetHeight > container.scrollTop + container.clientHeight) {
        container.scrollTop = day.offsetTop + day.offsetHeight - container.clientHeight;
      }
    }
    focusDay.current = false;
  }, [open, focused, month]);

  function updateText(next: string) {
    input.current?.setCustomValidity(next && !parseCalendarInput(next) ? "Введите существующую дату в формате ДД.ММ.ГГГГ." : "");
    setText(next);
    if (next !== text) onChange?.();
  }

  function openCalendar() {
    const current = localToday();
    const initial = value || current;
    setToday(current);
    setFocused(initial);
    setMonth(calendarMonth(initial));
    positionPopup();
    focusDay.current = true;
    setOpen(true);
  }

  function choose(iso: string) {
    updateText(formatCalendarInput(iso));
    setOpen(false);
    input.current?.focus({ preventScroll: true });
  }

  function navigateTo(iso: string) {
    focusDay.current = true;
    setFocused(iso);
    setMonth(calendarMonth(iso));
  }

  function handleDayKey(event: KeyboardEvent<HTMLButtonElement>, iso: string) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    let next: string;
    switch (event.key) {
      case "ArrowLeft": next = moveCalendarDay(iso, -1); break;
      case "ArrowRight": next = moveCalendarDay(iso, 1); break;
      case "ArrowUp": next = moveCalendarDay(iso, -7); break;
      case "ArrowDown": next = moveCalendarDay(iso, 7); break;
      case "Home": next = moveCalendarDay(iso, -calendarWeekday(iso)); break;
      case "End": next = moveCalendarDay(iso, 6 - calendarWeekday(iso)); break;
      case "PageUp": next = moveCalendarMonth(iso, event.shiftKey ? -12 : -1); break;
      case "PageDown": next = moveCalendarMonth(iso, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    navigateTo(next);
  }

  function showMonth(next: string) {
    // A month change must not leave focus on a day that is about to unmount.
    if (document.activeElement?.hasAttribute("data-date")) focusDay.current = true;
    setMonth(calendarMonth(next));
    setFocused(value && calendarMonth(value) === calendarMonth(next) ? value : calendarMonth(next));
  }

  return (
    <div ref={root} className={`${adminStyles.field} ${styles.root}`}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          input.current?.focus({ preventScroll: true });
        }
      }}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.control}>
        <input ref={input} id={id} className={styles.dateInput} type="text" value={text}
          placeholder="ДД.ММ.ГГГГ" autoComplete="off" required={required} maxLength={10}
          aria-describedby={`${id}-hint`} aria-haspopup="dialog"
          aria-controls={open ? `${id}-calendar` : undefined}
          onChange={(event) => updateText(event.target.value)}
          onBlur={() => { if (value) setText(formatCalendarInput(value)); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); openCalendar(); }
          }} />
        <input name={name} type="hidden" value={value} />
        <span id={`${id}-hint`} className={styles.srOnly}>Формат: день, месяц, год. Стрелка вниз открывает календарь.</span>
        <button className={styles.toggle} type="button" aria-label={`Открыть календарь: ${label.toLowerCase()}`}
          aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-calendar` : undefined}
          onClick={() => { if (open) setOpen(false); else openCalendar(); }}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4m8-4v4M4 11h16" /></svg>
        </button>
        {open ? (
          <div ref={popup} id={`${id}-calendar`} className={styles.popup} role="dialog" aria-label={`Календарь: ${label.toLowerCase()}`}
            data-above={position.above || undefined} style={{ maxHeight: position.maxHeight }}
            onInput={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
                // Confirming a year must never submit the article form.
                event.preventDefault();
                popup.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
              }
            }}>
            <div className={styles.toolbar}>
              <button type="button" className={styles.nav} aria-label="Предыдущий месяц" disabled={month === "0001-01-01"}
                onClick={() => showMonth(moveCalendarMonth(month, -1))}>
                <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m12 5-5 5 5 5" /></svg>
              </button>
              <select className={styles.month} aria-label="Месяц" value={monthIndex}
                onChange={(event) => showMonth(moveCalendarMonth(month, Number(event.target.value) - monthIndex))}>
                {months.map((name, index) => <option key={name} value={index}>{name}</option>)}
              </select>
              <input className={styles.year} type="number" aria-label="Год" min={1} max={9999} value={year}
                onChange={(event) => {
                  const next = event.target.valueAsNumber;
                  if (Number.isInteger(next) && next >= 1 && next <= 9999) showMonth(moveCalendarMonth(month, (next - year) * 12));
                }} />
              <button type="button" className={styles.nav} aria-label="Следующий месяц" disabled={month === "9999-12-01"}
                onClick={() => showMonth(moveCalendarMonth(month, 1))}>
                <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m8 5 5 5-5 5" /></svg>
              </button>
            </div>
            <span className={styles.srOnly} aria-live="polite">{months[monthIndex]} {year}</span>
            <div role="grid" aria-label={`${months[monthIndex]} ${year}`} className={styles.grid}>
              <div role="row" className={styles.week}>
                {weekdays.map((day) => <span key={day} role="columnheader" className={styles.weekday}>{day}</span>)}
              </div>
              {Array.from({ length: 6 }, (_, week) => (
                <div key={week} role="row" className={styles.week}>
                  {days.slice(week * 7, week * 7 + 7).map((day, index) => (
                    <div key={day.iso || index} role="gridcell" aria-selected={Boolean(value && value === day.iso)}>
                      {day.iso ? <button type="button" data-date={day.iso} className={styles.day}
                        data-outside={!day.inMonth || undefined} data-selected={value === day.iso || undefined}
                        aria-current={day.iso === today ? "date" : undefined}
                        aria-label={calendarDayLabel(day.iso)} tabIndex={focused === day.iso ? 0 : -1}
                        onFocus={() => setFocused(day.iso)} onKeyDown={(event) => handleDayKey(event, day.iso)}
                        onClick={() => choose(day.iso)}>{day.day}</button> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className={styles.footer}>
              <button type="button" onClick={() => choose("")}>Очистить</button>
              <button type="button" onClick={() => choose(localToday())}>Сегодня</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
