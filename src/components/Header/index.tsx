"use client";

import Link from "next/link";
import { useEffect, useState, type TransitionEvent } from "react";

import { Brand } from "@/components/Brand";
import type { HomeHeroVariant } from "@/components/HomeHero";
import { catalogSections, navItems } from "@/lib/site-data";

import styles from "./Header.module.css";

const homeHeroVariants = [1, 2, 3, 5] as const satisfies readonly HomeHeroVariant[];

type HeaderProps = {
  activeLink?: (typeof navItems)[number]["label"];
  static?: boolean;
  overlay?: boolean;
  heroVariant?: HomeHeroVariant;
  onHeroVariantChange?: (variant: HomeHeroVariant) => void;
};

export function Header({
  activeLink = "Главная",
  static: isStatic = false,
  overlay = false,
  heroVariant,
  onHeroVariantChange,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuActive, setMenuActive] = useState(false);

  useEffect(() => {
    if (!overlay) return;

    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  useEffect(() => {
    if (!menuVisible) return;

    const frame = window.requestAnimationFrame(() => setMenuActive(true));
    return () => window.cancelAnimationFrame(frame);
  }, [menuVisible]);

  useEffect(() => {
    if (!menuVisible) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuActive(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuVisible]);

  const closeMenu = () => setMenuActive(false);

  const selectHeroVariant = (variant: HomeHeroVariant) => {
    onHeroVariantChange?.(variant);
    closeMenu();
  };

  const toggleMenu = () => {
    if (menuActive) {
      closeMenu();
      return;
    }

    setMenuVisible(true);
  };

  const handlePanelTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== "transform" || menuActive) return;
    setMenuVisible(false);
  };

  return (
    <header
      className={[
        styles.header,
        isStatic ? styles.static : "",
        overlay ? styles.overlay : "",
        scrolled ? styles.scrolled : "",
        menuActive ? styles.menuOpen : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.inner}>
        <Brand href={activeLink === "Главная" ? "#top" : "/"} />
        <nav className={styles.desktopNav} aria-label="Основная навигация">
          {navItems.map(({ label, href }) =>
            label === "Каталог" ? (
              <div
                className={[
                  styles.navDropdown,
                  activeLink === "Каталог" ? styles.activeLink : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={label}
              >
                <span className={styles.dropdownTrigger} tabIndex={0}>
                  {label}
                </span>
                <div className={styles.dropdownMenu} role="menu">
                  {catalogSections.map((section) => (
                    <a href={section.href} key={section.href} role="menuitem">
                      {section.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <a
                className={label === activeLink ? styles.activeLink : undefined}
                href={href}
                key={label}
              >
                {label}
              </a>
            ),
          )}
        </nav>
        {heroVariant && onHeroVariantChange ? (
          <div className={styles.versionSwitch} aria-label="Версия первого экрана">
            <span>Версия</span>
            {homeHeroVariants.map((variant) => (
              <button
                type="button"
                className={variant === heroVariant ? styles.versionActive : undefined}
                aria-label={`Открыть версию ${variant}`}
                aria-pressed={variant === heroVariant}
                key={variant}
                onClick={() => onHeroVariantChange(variant)}
              >
                {variant}
              </button>
            ))}
          </div>
        ) : null}
        <div className={styles.actions}>
          <a className={styles.phone} href="tel:+74951234567">
            +7 (495) 123-45-67
          </a>
          <Link className={styles.cta} href="/#contacts">
            Стать партнёром
          </Link>
        </div>
        <div className={styles.mobileMenu}>
          <button
            type="button"
            className={[styles.menuToggle, menuActive ? styles.menuToggleOpen : ""]
              .filter(Boolean)
              .join(" ")}
            aria-expanded={menuActive}
            aria-label={menuActive ? "Закрыть меню" : "Открыть меню"}
            onClick={toggleMenu}
          >
            <span />
            <span />
            <span />
          </button>

          {menuVisible ? (
            <div
              className={[styles.mobileBackdrop, menuActive ? styles.mobileBackdropActive : ""]
                .filter(Boolean)
                .join(" ")}
              onClick={closeMenu}
            >
              <nav
                aria-label="Мобильная навигация"
                className={[styles.mobilePanel, menuActive ? styles.mobilePanelActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={(event) => event.stopPropagation()}
                onTransitionEnd={handlePanelTransitionEnd}
              >
                {heroVariant && onHeroVariantChange ? (
                  <div className={styles.mobileVersionSwitch} aria-label="Версия первого экрана">
                    <span>Первый экран</span>
                    <div>
                      {homeHeroVariants.map((variant) => (
                        <button
                          type="button"
                          className={variant === heroVariant ? styles.versionActive : undefined}
                          aria-pressed={variant === heroVariant}
                          key={variant}
                          onClick={() => selectHeroVariant(variant)}
                        >
                          Версия {variant}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {navItems.map(({ label, href }) =>
                  label === "Каталог" ? (
                    <details className={styles.mobileCatalog} key={label}>
                      <summary>{label}</summary>
                      {catalogSections.map((section) => (
                        <a href={section.href} key={section.href} onClick={closeMenu}>
                          {section.label}
                        </a>
                      ))}
                    </details>
                  ) : (
                    <a href={href} key={label} onClick={closeMenu}>
                      {label}
                    </a>
                  ),
                )}
                <a className={styles.mobilePhone} href="tel:+74951234567" onClick={closeMenu}>
                  +7 (495) 123-45-67
                </a>
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
