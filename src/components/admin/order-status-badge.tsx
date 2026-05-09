import {
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui/status-badge";
import type { OrderStatus } from "@/generated/prisma/enums";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const toneFor = (status: OrderStatus): StatusBadgeTone => {
  switch (status) {
    case "PENDING":
      return "warning";
    case "CONFIRMED":
      return "neutral";
    case "SHIPPED":
      return "info";
    case "DELIVERED":
      return "success";
    case "CANCELLED":
      return "danger";
  }
};

const labelFor = (status: OrderStatus): string => {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "CONFIRMED":
      return "Confirmed";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
  }
};

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => (
  <StatusBadge tone={toneFor(status)}>{labelFor(status)}</StatusBadge>
);
