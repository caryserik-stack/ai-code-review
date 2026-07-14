"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type SettingsTab = "account" | "general";

const FALLBACK_PATH = "/review/new";

export function useSettingsRoute() {
  const router = useRouter();
  const [path, setPath] = useState(() =>
    typeof window === "undefined" ? "" : window.location.pathname,
  );

  // true, только если /settings/* уже было активно в момент маунта хука —
  // то есть пользователь попал сюда через hard refresh или через реальную
  // навигацию браузера (не через наш open()). В этом случае Next.js
  // по-настоящему отрендерил пустой page.tsx как children, и под модалкой
  // нет "живой" предыдущей страницы, на которую можно тихо вернуться
  // через replaceState.
  const enteredViaHardNavigation = useRef(
    typeof window !== "undefined" &&
      window.location.pathname.startsWith("/settings"),
  );
  const previousPath = useRef<string | null>(
    enteredViaHardNavigation.current ? null : "/",
  );

  const isOpen = path.startsWith("/settings");
  const tab: SettingsTab = path.startsWith("/settings/general")
    ? "general"
    : "account";

  // Синхронизируем path с РЕАЛЬНЫМ location при popstate (кнопки
  // назад/вперёд браузера). Раньше этого слушателя не было вообще: URL
  // реально менялся, Next.js даже перерисовывал children под капотом
  // (это его собственный popstate-listener), а наш path (и, значит,
  // isOpen) об этом не знал и продолжал показывать модалку поверх уже
  // другой страницы — отсюда "дёргается и не убирается" на первый "Назад".
  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const open = useCallback(
    (targetTab: SettingsTab = "account") => {
      if (!isOpen) previousPath.current = window.location.pathname;
      const url = `/settings/${targetTab}`;
      window.history.replaceState(null, "", url);
      setPath(url);
    },
    [isOpen],
  );

  const switchTab = useCallback((targetTab: SettingsTab) => {
    const url = `/settings/${targetTab}`;
    window.history.replaceState(null, "", url);
    setPath(url);
  }, []);

  const close = useCallback(() => {
    // Случай A: модалка была открыта штатно через open() поверх уже
    // отрендеренной страницы — под ней реально лежит живой children,
    // тихого replaceState достаточно.
    if (previousPath.current !== null) {
      const url = previousPath.current;
      window.history.replaceState(null, "", url);
      setPath(url);
      previousPath.current = "/";
      return;
    }

    // Случай B: мы попали в /settings/* напрямую (hard refresh или
    // Back браузера пришёл сюда извне) — Next.js по-настоящему
    // отрендерил пустой page.tsx как children. Одного replaceState тут
    // недостаточно: children так и останется null навсегда, т.к.
    // replaceState не проходит через роутер Next.js. Поэтому это —
    // единственный случай, где сознательно делаем настоящую навигацию,
    // чтобы Next.js реально подгрузил и отрендерил контент.
    router.replace(FALLBACK_PATH);
    enteredViaHardNavigation.current = false;
  }, [router]);

  return { isOpen, tab, open, switchTab, close };
}
