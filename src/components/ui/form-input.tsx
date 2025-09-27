import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, required, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id || props.name}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <Input
          ref={ref}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };