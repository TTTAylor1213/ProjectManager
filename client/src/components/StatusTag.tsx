import { Tag } from "antd";

interface StatusTagProps {
  status: string;
  map: Record<string, { label: string; color: string }>;
}

export default function StatusTag({ status, map }: StatusTagProps) {
  const cfg = map[status];
  if (!cfg) return <Tag>{status || "-"}</Tag>;
  return <Tag color={cfg.color}>{cfg.label}</Tag>;
}
