import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { usePayments, useCreatePayment, useUpdatePayment, PaymentWithDetails, PaymentInsert } from "@/hooks/usePayments";
import { useTenants } from "@/hooks/useTenants";
import { useProperties } from "@/hooks/useProperties";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, CreditCard, MoreVertical, Edit, CheckCircle, Loader2, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
  overdue: { label: "Overdue", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

export default function Payments() {
  const { role } = useAuth();
  const { data: payments, isLoading } = usePayments();
  const { data: tenants } = useTenants();
  const { data: properties } = useProperties();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);

  const [formData, setFormData] = useState({
    tenant_id: "",
    property_id: "",
    amount: "",
    due_date: "",
    description: "",
    status: "pending" as "pending" | "completed" | "failed" | "overdue",
    payment_method: "",
    payment_reference: "",
  });

  const canManage = role === "admin" || role === "property_manager";

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch = payment.property?.title?.toLowerCase().includes(search.toLowerCase()) || 
      payment.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = {
    total: payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
    pending: payments?.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0) || 0,
    completed: payments?.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || 0,
    overdue: payments?.filter((p) => p.status === "overdue").length || 0,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: PaymentInsert = {
      tenant_id: formData.tenant_id,
      property_id: formData.property_id || null,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      description: formData.description || null,
      status: formData.status,
      payment_method: formData.payment_method || null,
      payment_reference: formData.payment_reference || null,
    };

    if (selectedPayment) {
      await updatePayment.mutateAsync({ id: selectedPayment.id, ...data });
    } else {
      await createPayment.mutateAsync(data);
    }
    setFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      tenant_id: "",
      property_id: "",
      amount: "",
      due_date: "",
      description: "",
      status: "pending",
      payment_method: "",
      payment_reference: "",
    });
    setSelectedPayment(null);
  };

  const openEdit = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setFormData({
      tenant_id: payment.tenant_id,
      property_id: payment.property_id || "",
      amount: payment.amount.toString(),
      due_date: payment.due_date,
      description: payment.description || "",
      status: payment.status || "pending",
      payment_method: payment.payment_method || "",
      payment_reference: payment.payment_reference || "",
    });
    setFormOpen(true);
  };

  const markAsCompleted = async (payment: PaymentWithDetails) => {
    await updatePayment.mutateAsync({
      id: payment.id,
      status: "completed",
      payment_date: new Date().toISOString(),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Payments</h1>
            <p className="text-muted-foreground mt-1">Track and manage rent payments</p>
          </div>
          {canManage && (
            <Button onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(stats.completed)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{formatCurrency(stats.pending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdue} payments</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
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
            ) : filteredPayments?.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No payments found</h3>
                <p className="text-muted-foreground">Record your first payment to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments?.map((payment) => {
                    const status = statusConfig[payment.status || "pending"];
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.property ? (
                            <div>
                              <p className="font-medium">{payment.property.title}</p>
                              <p className="text-sm text-muted-foreground">{payment.description}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">{payment.description || "—"}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{format(new Date(payment.due_date), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{payment.payment_method || "—"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canManage && payment.status !== "completed" && (
                                <DropdownMenuItem onClick={() => markAsCompleted(payment)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              {canManage && (
                                <DropdownMenuItem onClick={() => openEdit(payment)}>
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
              <DialogTitle>{selectedPayment ? "Edit Payment" : "Record Payment"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select
                  value={formData.tenant_id}
                  onValueChange={(value) => setFormData({ ...formData, tenant_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants?.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.profile?.full_name || tenant.profile?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "pending" | "completed" | "failed" | "overdue") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Input
                    id="payment_method"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    placeholder="Bank transfer, Cash, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Rent payment for January 2024"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedPayment ? "Update" : "Record"} Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
