import { useToast } from '../../hooks/use-toast';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 pointer-events-none">
      <div className="flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              animation: 'slideInFromBottom 0.2s ease-out'
            }}
          >
            <div className="bg-white rounded-lg shadow-lg border p-4 max-w-md">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{toast.title}</p>
                  {toast.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {toast.description}
                    </p>
                  )}
                  {toast.action && (
                    <div className="mt-3">{toast.action}</div>
                  )}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInFromBottom {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

export { useToast } from '../../hooks/use-toast';
