"use client";

type InlineSelectProps = {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

/**
 * Бейдж с текущим значением, по клику раскрывающий список опций.
 * Используется и для выбора языка, и для выбора уровня ревьюера на мобильных —
 * вместо двух почти одинаковых кусков JSX держим одну реализацию.
 *
 * isOpen/onOpenChange контролируются снаружи (а не внутренним useState),
 * чтобы родитель мог гарантировать, что открыт только один dropdown за раз.
 */
export function InlineSelect({
  value,
  options,
  onChange,
  isOpen,
  onOpenChange,
  className = "",
}: InlineSelectProps) {
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="text-xs font-mono px-2 py-1 rounded bg-gray-100 dark:bg-surface-dark text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 capitalize"
      >
        {value}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                onOpenChange(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-mono capitalize hover:bg-gray-100 dark:hover:bg-surface-dark ${
                option === value
                  ? "text-blue-600 dark:text-blue-400 font-medium"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
