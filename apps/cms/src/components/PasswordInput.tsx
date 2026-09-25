import { cn } from '@coastal-talk-news/ui/cn';
import { Input } from '@coastal-talk-news/ui/input';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'icon'>;

/** A password field with its own show/hide control. Hidden again whenever the
 *  field is remounted, so a revealed password never outlives its form. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        // Off for the things that mangle or leak a password as it is typed.
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        type={visible ? 'text' : 'password'}
        icon={<Lock className="size-4" aria-hidden />}
        className={cn('pr-11', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="text-ink-subtle hover:text-ink absolute inset-y-0 right-0 flex items-center px-3"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden />
        ) : (
          <Eye className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
