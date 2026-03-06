'use client';

interface NotificationsPanelProps {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  return (
    <div className="pointer-events-auto absolute right-4 top-16 z-20 w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-xl">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Уведомления</h3>
        <button
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
      <p className="text-slate-500">
        Здесь будут отображаться напоминания о задачах, сроках и событиях.
      </p>
    </div>
  );
}

