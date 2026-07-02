import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Options {
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
  onCloseModal: () => void;
}

export const useKeyboardShortcuts = ({
  onToggleSidebar,
  onCloseSidebar,
  onCloseModal,
}: Options) => {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Игнорируем если юзер печатает в инпуте
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      // Ctrl + B — toggle сайдбар
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // Escape — закрыть сайдбар или модалку
      if (e.key === "Escape") {
        onCloseSidebar();
        onCloseModal();
        return;
      }

      // Ctrl + N — новое ревью (только если не печатаем)
      if (e.altKey && e.key === "n" && !isTyping) {
        e.preventDefault();
        router.push("/review/new");
        return;
      }

      // Ctrl + K — фокус на поиск (только если не печатаем)
      if ((e.ctrlKey || e.metaKey) && e.key === "k" && !isTyping) {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder="Search reviews..."]',
        );
        if (searchInput) {
          onToggleSidebar(); // открываем сайдбар если закрыт
          setTimeout(() => searchInput.focus(), 200); // ждём анимацию
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleSidebar, onCloseSidebar, onCloseModal, router]);
};
