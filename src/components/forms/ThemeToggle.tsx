// src/components/forms/ThemeToggle.tsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Toggle component for theme selection
 * Currently a placeholder - theme management will be implemented later
 */
export function ThemeToggle() {
  // For now, just show a disabled toggle
  // Theme management with proper state will be added in a future iteration
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <Label htmlFor="theme-toggle" className="text-base font-medium">
          Tryb ciemny
        </Label>
        <p className="text-sm text-muted-foreground">Zmień motyw interfejsu na ciemny</p>
      </div>
      <Switch id="theme-toggle" checked={false} disabled aria-label="Przełącz na tryb ciemny" />
    </div>
  );
}
