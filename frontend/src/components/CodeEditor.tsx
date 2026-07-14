"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { getLanguageExtension } from "@/lib/languageExtensions";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onPaste?: (pastedText: string) => void;
  language: string;
  disabled?: boolean;
  maxHeight?: number; // px, по умолчанию без ограничения
};

export function CodeEditor({
  value,
  onChange,
  onPaste,
  language,
  disabled = false,
  maxHeight = 600,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const editableCompartment = useRef(new Compartment()).current;
  // Храним актуальные колбэки в ref, чтобы не пересоздавать EditorView на каждый рендер
  const onChangeRef = useRef(onChange);
  const onPasteRef = useRef(onPaste);
  onChangeRef.current = onChange;
  onPasteRef.current = onPaste;

  // Пересоздаём редактор только при смене языка (подсветка синтаксиса —
  // это отдельное extension, "на лету" его не подменить без пересоздания state)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        oneDark,
        getLanguageExtension(language),
        EditorView.lineWrapping,
        editableCompartment.of(EditorView.editable.of(!disabled)),
        EditorView.domEventHandlers({
          paste(event) {
            const text = event.clipboardData?.getData("text");
            if (text) onPasteRef.current?.(text);
            // не preventDefault — даём CodeMirror вставить текст как обычно
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
        EditorView.theme({
          "&": { maxHeight: `${maxHeight}px` },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-mono, monospace)",
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // намеренно не следим за value/disabled здесь — см. следующий useEffect

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: editableCompartment.reconfigure(EditorView.editable.of(!disabled)),
    });
  }, [disabled])

  // Синхронизация внешнего value -> редактор (например, после дропа файла)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-gray-300 dark:border-border-dark overflow-hidden [&_.cm-editor]:text-sm"
    />
  );
}
