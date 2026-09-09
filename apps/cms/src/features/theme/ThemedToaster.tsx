import { Toaster } from 'sonner';
import { useTheme } from './useTheme.js';

/** Toasts follow the app theme; sonner cannot read it on its own. */
export function ThemedToaster() {
  const { resolved } = useTheme();

  return (
    <Toaster
      theme={resolved}
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{ style: { borderRadius: '0.75rem' } }}
    />
  );
}
