import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import type { ApprovalStatus } from "@shared/schema";

interface TaskApprovalBadgeProps {
  approvalStatus?: ApprovalStatus | null;
  compact?: boolean;
}

export function TaskApprovalBadge({ approvalStatus, compact = false }: TaskApprovalBadgeProps) {
  if (!approvalStatus) {
    return null;
  }

  const statusConfig = {
    DRAFT: {
      variant: 'secondary' as const,
      label: compact ? 'Pending' : 'Pending Approval',
      icon: Clock,
      className: '',
    },
    IN_REVIEW: {
      variant: 'default' as const,
      label: compact ? 'Review' : 'In Review',
      icon: AlertCircle,
      className: '',
    },
    APPROVED: {
      variant: 'default' as const,
      label: compact ? 'Approved' : 'Approved',
      icon: CheckCircle,
      className: 'bg-green-500 hover:bg-green-600',
    },
    CHANGES_REQUESTED: {
      variant: 'destructive' as const,
      label: compact ? 'Changes' : 'Changes Requested',
      icon: XCircle,
      className: '',
    },
  };

  const config = statusConfig[approvalStatus];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={config.className}
      data-testid={`badge-approval-${approvalStatus.toLowerCase()}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
