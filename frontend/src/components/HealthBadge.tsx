"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/lib/i18n";
import { fetchHealth } from "@/lib/api";

export function HealthBadge({ t }: { t: Dictionary }) {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["backend-health"],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const online = Boolean(data?.backend_available) && !isError;

  return (
    <Badge>
      {online ? (
        <Activity className="size-3.5 text-success" aria-hidden />
      ) : (
        <WifiOff className="size-3.5 text-danger" aria-hidden />
      )}
      <span>{isLoading ? t.health.checking : online ? t.health.online : t.health.offline}</span>
    </Badge>
  );
}
