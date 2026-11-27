"use client";

import { useState } from "react";
import styles from "./PageVariants.module.css";
import type { Detail } from "./model";

export function Topics({ items }: { items: readonly Detail[] }) {
  const [selected, select] = useState(0);

  return (
    <div className={styles.topicBox}>
      <div aria-label="Тема обращения" role="group">
        {items.map(([title], index) => (
          <button key={title} type="button" aria-pressed={index === selected} onClick={() => select(index)}>{title}</button>
        ))}
      </div>
      <div className={styles.topicText} key={selected} aria-live="polite">
        <h2>{items[selected][0]}</h2>
        <p>{items[selected][1]}</p>
      </div>
    </div>
  );
}
