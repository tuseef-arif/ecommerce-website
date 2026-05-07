import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui/status-badge";
import type { OrderStatus } from "@/generated/prisma/enums";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const toneFor = (status: OrderStatus): StatusBadgeTone => {
  if (status === "PENDING") return "warning";
  if (status === "CONFIRMED") return "neutral";
  if (status === "SHIPPED") return "info";
  return "success";
};

const labelFor = (status: OrderStatus): string => {
  if (status === "PENDING") return "Pending";
  if (status === "CONFIRMED") return "Confirmed";
  if (status === "SHIPPED") return "Shipped";
  return "Delivered";
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => (
  <StatusBadge tone={toneFor(status)}>{labelFor(status)}</StatusBadge>
);
