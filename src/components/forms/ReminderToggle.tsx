// src/components/forms/ReminderToggle.tsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ReminderToggleProps {
  /** Whether reminders are currently enabled */
  enabled: boolean;
  /** Callback when the toggle is changed */
  onToggle: (enabled: boolean) => void;
  /** Whether the toggle is disabled (e.g., during submission) */
  disabled?: boolean;
}

/**
 * Toggle component for email reminders
 */
export function ReminderToggle({ enabled, onToggle, disabled = false }: ReminderToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label htmlFor="reminder-toggle" className="text-base font-medium">
          Przypomnienia e-mail
        </Label>
        <p className="text-sm text-muted-foreground">Otrzymuj codzienne przypomnienia o pomiarze ciśnienia</p>
      </div>
      <Switch
        id="reminder-toggle"
        checked={enabled}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label="Włącz przypomnienia e-mail"
      />
    </div>
  );
}
