// src/components/LevelBadge.tsx
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { MeasurementEntity } from "@/types";

interface LevelBadgeProps {
  level: MeasurementEntity["level"];
}

/**
 * Visual component for displaying blood pressure level
 * with appropriate color, icon, and text label
 */
export function LevelBadge({ level }: LevelBadgeProps) {
  const config = getLevelConfig(level);

  return (
    <Badge variant={config.variant} className={config.className}>
      <config.icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

/**
 * Returns configuration for each blood pressure level
 */
function getLevelConfig(level: MeasurementEntity["level"]) {
  switch (level) {
    case "optimal":
      return {
        label: "Optymalne",
        icon: CheckCircle,
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600 text-white",
      };
    case "normal":
      return {
        label: "Normalne",
        icon: CheckCircle,
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      };
    case "high_normal":
      return {
        label: "Wysokie normalne",
        icon: AlertCircle,
        variant: "default" as const,
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
      };
    case "grade1":
      return {
        label: "Nadciśnienie I°",
        icon: AlertTriangle,
        variant: "default" as const,
        className: "bg-orange-500 hover:bg-orange-600 text-white",
      };
    case "grade2":
      return {
        label: "Nadciśnienie II°",
        icon: AlertTriangle,
        variant: "default" as const,
        className: "bg-red-500 hover:bg-red-600 text-white",
      };
    case "grade3":
      return {
        label: "Nadciśnienie III°",
        icon: XCircle,
        variant: "default" as const,
        className: "bg-red-700 hover:bg-red-800 text-white",
      };
    case "hypertensive_crisis":
      return {
        label: "Przełom nadciśnieniowy",
        icon: XCircle,
        variant: "default" as const,
        className: "bg-red-900 hover:bg-red-950 text-white animate-pulse",
      };
    default:
      return {
        label: "Nieznany",
        icon: AlertCircle,
        variant: "outline" as const,
        className: "",
      };
  }
}
