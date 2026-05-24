"use client";

export function ActionBanner({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded border border-sky-300 bg-white px-2 py-0.5 text-xs font-medium text-sky-800 hover:bg-sky-100"
      >
        Zamknij
      </button>
    </div>
  );
}
