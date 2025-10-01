import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import type { ApprovalStatus } from "@shared/schema";

interface ApprovalActionsProps {
  entityType: 'asset' | 'task';
  entityId: string;
  currentStatus: ApprovalStatus;
  reviewNotes?: string | null;
  onStatusChange?: () => void;
  canApprove?: boolean;
}

export function ApprovalActions({
  entityType,
  entityId,
  currentStatus,
  reviewNotes,
  onStatusChange,
  canApprove = false,
}: ApprovalActionsProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'request_changes' | null>(null);
  const [notes, setNotes] = useState('');

  const updateApprovalMutation = useMutation({
    mutationFn: async ({
      approvalStatus,
      reviewNotes,
    }: {
      approvalStatus: ApprovalStatus;
      reviewNotes?: string;
    }) => {
      const endpoint =
        entityType === 'asset'
          ? `/api/assets/${entityId}/approval`
          : `/api/tasks/${entityId}/approval`;
      const response = await apiRequest('PATCH', endpoint, {
        approvalStatus,
        reviewNotes,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate org-scoped queries (array keys) for assets and tasks
      queryClient.invalidateQueries({ 
        predicate: q => 
          Array.isArray(q.queryKey) && 
          q.queryKey[0] === '/api/organizations' && 
          (q.queryKey.includes('tasks') || q.queryKey.includes('assets'))
      });
      // Invalidate specific entity detail queries
      const detailKey = entityType === 'asset' ? '/api/assets' : '/api/tasks';
      queryClient.invalidateQueries({ queryKey: [detailKey, entityId] });
      
      toast({
        title: 'Approval Updated',
        description: `${entityType === 'asset' ? 'Asset' : 'Task'} approval status has been updated.`,
      });
      setDialogOpen(false);
      setNotes('');
      setSelectedAction(null);
      if (onStatusChange) onStatusChange();
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update approval status.',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = () => {
    setSelectedAction('approve');
    setDialogOpen(true);
  };

  const handleRequestChanges = () => {
    setSelectedAction('request_changes');
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedAction) return;

    const approvalStatus: ApprovalStatus =
      selectedAction === 'approve' ? 'APPROVED' : 'CHANGES_REQUESTED';
    updateApprovalMutation.mutate({ approvalStatus, reviewNotes: notes });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      DRAFT: {
        variant: 'secondary' as const,
        label: 'Pending Approval',
        icon: Clock,
        className: undefined,
      },
      IN_REVIEW: {
        variant: 'default' as const,
        label: 'In Review',
        icon: AlertCircle,
        className: undefined,
      },
      APPROVED: {
        variant: 'default' as const,
        label: 'Approved',
        icon: CheckCircle,
        className: 'bg-green-500',
      },
      CHANGES_REQUESTED: {
        variant: 'destructive' as const,
        label: 'Changes Requested',
        icon: XCircle,
        className: undefined,
      },
    };

    const config = statusConfig[currentStatus];
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className={config.className}
        data-testid={`badge-approval-${currentStatus.toLowerCase()}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {getStatusBadge()}
        
        {canApprove && currentStatus !== 'APPROVED' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={updateApprovalMutation.isPending}
              data-testid="button-approve"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRequestChanges}
              disabled={updateApprovalMutation.isPending}
              data-testid="button-request-changes"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Request Changes
            </Button>
          </div>
        )}
      </div>

      {reviewNotes && (
        <div className="text-sm text-muted-foreground" data-testid="text-review-notes">
          <strong>Review Notes:</strong> {reviewNotes}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-approval">
          <DialogHeader>
            <DialogTitle>
              {selectedAction === 'approve' ? 'Approve' : 'Request Changes'}
            </DialogTitle>
            <DialogDescription>
              {selectedAction === 'approve'
                ? `Approve this ${entityType} for publication?`
                : `Request changes for this ${entityType}. Please provide feedback.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {selectedAction === 'approve' ? 'Notes (Optional)' : 'Required Changes *'}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selectedAction === 'approve'
                    ? 'Add any notes...'
                    : 'Describe what changes are needed...'
                }
                data-testid="textarea-approval-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-approval">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                updateApprovalMutation.isPending ||
                (selectedAction === 'request_changes' && !notes.trim())
              }
              data-testid="button-confirm-approval"
            >
              {updateApprovalMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
