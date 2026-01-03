import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useMaintenanceRequests, useCreateMaintenanceRequest, useUpdateMaintenanceRequest, MaintenanceWithDetails, MaintenanceRequestInsert } from "@/hooks/useMaintenanceRequests";
import { useProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Wrench, MoreVertical, Edit, CheckCircle, Loader2, AlertCircle, Clock, CircleDot } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  open: { label: "Open", color: "bg-info/10 text-info border-info/20", icon: CircleDot },
  in_progress: { label: "In Progress", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-secondary text-secondary-foreground" },
  medium: { label: "Medium", color: "bg-warning/10 text-warning border-warning/20" },
  high: { label: "High", color: "bg-destructive/10 text-destructive border-destructive/20" },
  urgent: { label: "Urgent", color: "bg-destructive text-destructive-foreground" },
};

export default function Maintenance() {
  const { role, user } = useAuth();
  const { data: requests, isLoading } = useMaintenanceRequests();
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const createRequest = useCreateMaintenanceRequest();
  const updateRequest = useUpdateMaintenanceRequest();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceWithDetails | null>(null);

  const [formData, setFormData] = useState({
    property_id: "",
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    status: "open" as "open" | "in_progress" | "completed",
  });

  const canManage = role === "admin" || role === "property_manager";
  const isTenant = role === "tenant";

  // Get tenant record for current user
  const currentTenant = tenants?.find((t) => t.user_id === user?.id);

  const filteredRequests = requests?.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(search.toLowerCase()) ||
      request.property?.title?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: requests?.filter((r) => r.status === "open").length || 0,
    inProgress: requests?.filter((r) => r.status === "in_progress").length || 0,
    completed: requests?.filter((r) => r.status === "completed").length || 0,
    urgent: requests?.filter((r) => r.priority === "urgent" || r.priority === "high").length || 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: MaintenanceRequestInsert = {
      property_id: formData.property_id,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      status: formData.status,
      tenant_id: isTenant && currentTenant ? currentTenant.id : null,
    };

    if (selectedRequest) {
      await updateRequest.mutateAsync({ id: selectedRequest.id, ...data });
    } else {
      await createRequest.mutateAsync(data);
    }
    setFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      property_id: isTenant && currentTenant?.property_id ? currentTenant.property_id : "",
      title: "",
      description: "",
      priority: "medium",
      status: "open",
    });
    setSelectedRequest(null);
  };

  const openEdit = (request: MaintenanceWithDetails) => {
    setSelectedRequest(request);
    setFormData({
      property_id: request.property_id,
      title: request.title,
      description: request.description || "",
      priority: (request.priority as "low" | "medium" | "high" | "urgent") || "medium",
      status: (request.status as "open" | "in_progress" | "completed") || "open",
    });
    setFormOpen(true);
  };

  const updateStatus = async (request: MaintenanceWithDetails, newStatus: string) => {
    await updateRequest.mutateAsync({
      id: request.id,
      status: newStatus,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Maintenance</h1>
            <p className="text-muted-foreground mt-1">
              {isTenant ? "Submit and track maintenance requests" : "Manage maintenance requests"}
            </p>
          </div>
          <Button onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        </div>

        {/* Stats */}
        {canManage && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">{stats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">High Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.urgent}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filteredRequests?.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No maintenance requests</h3>
                <p className="text-muted-foreground">Submit a request when something needs fixing</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Issue</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests?.map((request) => {
                    const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.open;
                    const priority = priorityConfig[request.priority as keyof typeof priorityConfig] || priorityConfig.medium;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.title}</p>
                            {request.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {request.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.property ? (
                            <div>
                              <p className="font-medium">{request.property.title}</p>
                              <p className="text-sm text-muted-foreground">{request.property.address}</p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canManage && request.status === "open" && (
                                <DropdownMenuItem onClick={() => updateStatus(request, "in_progress")}>
                                  <Clock className="mr-2 h-4 w-4" />
                                  Start Progress
                                </DropdownMenuItem>
                              )}
                              {canManage && request.status === "in_progress" && (
                                <DropdownMenuItem onClick={() => updateStatus(request, "completed")}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                              )}
                              {canManage && (
                                <DropdownMenuItem onClick={() => openEdit(request)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        <Dialog open={formOpen} onOpenChange={() => { setFormOpen(false); resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedRequest ? "Edit Request" : "New Maintenance Request"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isTenant && (
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties?.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Leaking faucet in bathroom"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide details about the issue..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {canManage && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "open" | "in_progress" | "completed") =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedRequest ? "Update" : "Submit"} Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
