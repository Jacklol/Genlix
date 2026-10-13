"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ContactRequestForm } from "@/components/ContactRequestForm";
import type { ContactProductContext } from "@/lib/contact-requests/types";

import styles from "./ContactRequestModal.module.css";

type ContactRequestModalProps = {
  className?: string;
  label: string;
  product?: ContactProductContext;
};

export function ContactRequestModal({ className, label, product }: ContactRequestModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPointerDown = useRef(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (dialogRef.current?.open) setClosing(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const { overflow, paddingRight } = document.body.style;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    // Keep the dialog in the top layer until both exit animations finish.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    const timeout = window.setTimeout(() => dialogRef.current?.close(), duration);
    return () => window.clearTimeout(timeout);
  }, [closing]);

  return (
    <>
      <button className={className} type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {label}
      </button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        data-closing={closing || undefined}
        aria-label="Заявка на партнёрство"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClose={() => {
          setOpen(false);
          setClosing(false);
          backdropPointerDown.current = false;
        }}
        onPointerDown={(event) => {
          backdropPointerDown.current = event.target === event.currentTarget;
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && backdropPointerDown.current) close();
          backdropPointerDown.current = false;
        }}
      >
        <div className={styles.panel}>
          <button className={styles.close} type="button" aria-label="Закрыть форму" onClick={close}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="m4 4 10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className={styles.content}>
            {open ? <ContactRequestForm product={product} onClose={close} /> : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
