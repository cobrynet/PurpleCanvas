import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Package, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useOrganization } from "@/hooks/useOrganization";
import { Redirect } from "wouter";

type DeliverableStatus = 'PENDING' | 'READY_FOR_REVIEW' | 'DELIVERED' | 'CHANGES_REQUESTED' | 'APPROVED';

interface Order {
  id: string;
  organizationId: string;
  serviceId: string;
  serviceName: string;
  requestDetails: string;
  deliverableStatus: DeliverableStatus;
  deliverableUrl: string | null;
  reviewNotes: string | null;
  slaDeadline: string;
  deliveredAt: string | null;
  createdAt: string;
  assigneeVendorUserId: string;
}

export default function VendorConsole() {
  const { toast } = useToast();
  const { selectedOrganization, isLoading: orgLoading } = useOrganization();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<DeliverableStatus>('PENDING');
  const [reviewNotes, setReviewNotes] = useState('');
  
  const userRole = selectedOrganization?.membership?.role;

  const { data: orders, isLoading, isError, error, refetch } = useQuery<Order[]>({
    queryKey: ['/api/vendor/orders'],
    enabled: userRole === 'VENDOR', // Only fetch if user is vendor
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, deliverableStatus, reviewNotes }: { orderId: string; deliverableStatus: DeliverableStatus; reviewNotes?: string }) => {
      const response = await apiRequest("PATCH", `/api/vendor/orders/${orderId}/deliverable`, {
        deliverableStatus,
        reviewNotes,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/orders'] });
      toast({
        title: "Status Updated",
        description: "Order deliverable status has been updated successfully.",
      });
      setSelectedOrder(null);
      setReviewNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = (orderId: string) => {
    updateStatusMutation.mutate({ orderId, deliverableStatus: statusUpdate, reviewNotes });
  };

  const getStatusBadge = (status: DeliverableStatus) => {
    const statusConfig = {
      PENDING: { variant: 'secondary' as const, label: 'Pending' },
      READY_FOR_REVIEW: { variant: 'default' as const, label: 'Ready for Review' },
      DELIVERED: { variant: 'default' as const, label: 'Delivered' },
      CHANGES_REQUESTED: { variant: 'destructive' as const, label: 'Changes Requested' },
      APPROVED: { variant: 'default' as const, label: 'Approved' },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const getSLAStatus = (deadline: string, deliveredAt: string | null) => {
    if (deliveredAt) {
      const delivered = new Date(deliveredAt);
      const sla = new Date(deadline);
      if (delivered <= sla) {
        return <Badge variant="default" className="bg-green-500" data-testid="badge-sla-met"><CheckCircle className="w-3 h-3 mr-1" />Met SLA</Badge>;
      } else {
        return <Badge variant="destructive" data-testid="badge-sla-missed"><AlertCircle className="w-3 h-3 mr-1" />Missed SLA</Badge>;
      }
    } else {
      const now = new Date();
      const sla = new Date(deadline);
      if (now < sla) {
        return <Badge variant="secondary" data-testid="badge-sla-pending"><Clock className="w-3 h-3 mr-1" />{formatDistanceToNow(sla, { addSuffix: true })}</Badge>;
      } else {
        return <Badge variant="destructive" data-testid="badge-sla-overdue"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      }
    }
  };

  // Show loading while organization context is resolving
  if (orgLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center" data-testid="loading-org-context">Loading...</div>
      </div>
    );
  }

  // Route guard: block access if not vendor
  if (userRole !== 'VENDOR') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4" data-testid="unauthorized-vendor">
              <ShieldAlert className="w-12 h-12 mx-auto text-destructive" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Access Denied</h3>
                <p className="text-muted-foreground mb-4">
                  You do not have permission to access the Vendor Console.
                </p>
                <Button asChild data-testid="button-back-home">
                  <a href="/">Go to Dashboard</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center" data-testid="loading-vendor-orders">Loading vendor orders...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4" data-testid="error-vendor-orders">
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Failed to Load Orders</h3>
                <p className="text-muted-foreground mb-4">
                  {error?.message || "An error occurred while fetching your orders."}
                </p>
                <Button onClick={() => refetch()} data-testid="button-retry">
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-vendor-console">Vendor Console</h1>
        <p className="text-muted-foreground" data-testid="text-vendor-description">Manage your assigned orders and deliverables</p>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground" data-testid="text-no-orders">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders assigned to you yet.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} data-testid={`card-order-${order.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle data-testid={`text-service-${order.id}`}>{order.serviceName}</CardTitle>
                    <CardDescription data-testid={`text-order-id-${order.id}`}>Order ID: {order.id}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.deliverableStatus)}
                    {getSLAStatus(order.slaDeadline, order.deliveredAt)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Details</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-request-${order.id}`}>{order.requestDetails}</p>
                </div>

                {order.reviewNotes && (
                  <div>
                    <h4 className="font-semibold mb-2">Review Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid={`text-review-notes-${order.id}`}>{order.reviewNotes}</p>
                  </div>
                )}

                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span> {format(new Date(order.createdAt), 'PPp')}
                  </div>
                  <div>
                    <span className="font-medium">SLA Deadline:</span> {format(new Date(order.slaDeadline), 'PPp')}
                  </div>
                  {order.deliveredAt && (
                    <div>
                      <span className="font-medium">Delivered:</span> {format(new Date(order.deliveredAt), 'PPp')}
                    </div>
                  )}
                </div>

                {selectedOrder === order.id ? (
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Update Status</label>
                      <Select value={statusUpdate} onValueChange={(value) => setStatusUpdate(value as DeliverableStatus)}>
                        <SelectTrigger data-testid={`select-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="READY_FOR_REVIEW">Ready for Review</SelectItem>
                          <SelectItem value="DELIVERED">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add any notes or updates..."
                        data-testid={`textarea-notes-${order.id}`}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateStatus(order.id)}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-submit-status-${order.id}`}
                      >
                        {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(null);
                          setReviewNotes('');
                        }}
                        data-testid={`button-cancel-${order.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      setSelectedOrder(order.id);
                      setStatusUpdate(order.deliverableStatus);
                      setReviewNotes('');
                    }}
                    disabled={order.deliverableStatus === 'APPROVED'}
                    data-testid={`button-update-${order.id}`}
                  >
                    Update Deliverable Status
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
