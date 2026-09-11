import { Toaster } from 'sonner';
import { useTheme } from './useTheme.js';

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
