import { useEffect } from "react";

interface Options {
  onSubmit: () => void;
  enabled: boolean;
}

export const useSubmitShortcut = ({ onSubmit, enabled }: Options) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (enabled) {
          e.preventDefault();
          onSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSubmit, enabled]);
};
