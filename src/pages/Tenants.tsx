import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, TenantWithProfile, TenantInsert } from "@/hooks/useTenants";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Users, MoreVertical, Edit, Trash2, Eye, Loader2, Calendar, Home } from "lucide-react";
import { format } from "date-fns";

export default function Tenants() {
  const { role } = useAuth();
  const { data: tenants, isLoading } = useTenants();
  const { data: properties } = useProperties();
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithProfile | null>(null);
  const [viewTenant, setViewTenant] = useState<TenantWithProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_id: "",
    property_id: "",
    lease_start: "",
    lease_end: "",
    monthly_rent: "",
    security_deposit: "",
  });

  const canManage = role === "admin" || role === "property_manager";

  const filteredTenants = tenants?.filter((tenant) => {
    const name = tenant.profile?.full_name || "";
    const email = tenant.profile?.email || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: TenantInsert = {
      user_id: formData.user_id,
      property_id: formData.property_id || null,
      lease_start: formData.lease_start || null,
      lease_end: formData.lease_end || null,
      monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
      security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
    };

    if (selectedTenant) {
      await updateTenant.mutateAsync({ id: selectedTenant.id, ...data });
    } else {
      await createTenant.mutateAsync(data);
    }
    setFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      property_id: "",
      lease_start: "",
      lease_end: "",
      monthly_rent: "",
      security_deposit: "",
    });
    setSelectedTenant(null);
  };

  const openEdit = (tenant: TenantWithProfile) => {
    setSelectedTenant(tenant);
    setFormData({
      user_id: tenant.user_id,
      property_id: tenant.property_id || "",
      lease_start: tenant.lease_start || "",
      lease_end: tenant.lease_end || "",
      monthly_rent: tenant.monthly_rent?.toString() || "",
      security_deposit: tenant.security_deposit?.toString() || "",
    });
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (tenantToDelete) {
      await deleteTenant.mutateAsync(tenantToDelete);
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Tenants</h1>
            <p className="text-muted-foreground mt-1">
              {tenants?.filter((t) => t.is_active).length || 0} active tenants
            </p>
          </div>
          {canManage && (
            <Button onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : filteredTenants?.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No tenants found</h3>
                <p className="text-muted-foreground">Add your first tenant to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Lease Period</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants?.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.profile?.full_name || "—"}</p>
                          <p className="text-sm text-muted-foreground">{tenant.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {tenant.property ? (
                          <div>
                            <p className="font-medium">{tenant.property.title}</p>
                            <p className="text-sm text-muted-foreground">{tenant.property.address}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tenant.lease_start && tenant.lease_end ? (
                          <div className="text-sm">
                            <p>{format(new Date(tenant.lease_start), "MMM d, yyyy")}</p>
                            <p className="text-muted-foreground">
                              to {format(new Date(tenant.lease_end), "MMM d, yyyy")}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(tenant.monthly_rent)}</TableCell>
                      <TableCell>
                        <Badge variant={tenant.is_active ? "default" : "secondary"}>
                          {tenant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewTenant(tenant)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canManage && (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(tenant)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => { setTenantToDelete(tenant.id); setDeleteDialogOpen(true); }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        <Dialog open={formOpen} onOpenChange={() => { setFormOpen(false); resetForm(); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedTenant ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  placeholder="User UUID from auth"
                  required
                />
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
                    {properties?.filter((p) => p.status === "available" || p.id === formData.property_id).map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - {property.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lease_start">Lease Start</Label>
                  <Input
                    id="lease_start"
                    type="date"
                    value={formData.lease_start}
                    onChange={(e) => setFormData({ ...formData, lease_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lease_end">Lease End</Label>
                  <Input
                    id="lease_end"
                    type="date"
                    value={formData.lease_end}
                    onChange={(e) => setFormData({ ...formData, lease_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_rent">Monthly Rent (₦)</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security_deposit">Security Deposit (₦)</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedTenant ? "Update" : "Add"} Tenant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Tenant */}
        <Dialog open={!!viewTenant} onOpenChange={() => setViewTenant(null)}>
          <DialogContent>
            {viewTenant && (
              <>
                <DialogHeader>
                  <DialogTitle>Tenant Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{viewTenant.profile?.full_name || "—"}</h3>
                    <p className="text-muted-foreground">{viewTenant.profile?.email}</p>
                    {viewTenant.profile?.phone && (
                      <p className="text-muted-foreground">{viewTenant.profile.phone}</p>
                    )}
                  </div>
                  {viewTenant.property && (
                    <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
                      <Home className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium">{viewTenant.property.title}</p>
                        <p className="text-sm text-muted-foreground">{viewTenant.property.address}</p>
                      </div>
                    </div>
                  )}
                  {viewTenant.lease_start && viewTenant.lease_end && (
                    <div className="flex items-start gap-2 p-3 bg-secondary rounded-lg">
                      <Calendar className="h-5 w-5 text-accent mt-0.5" />
                      <div>
                        <p className="font-medium">Lease Period</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(viewTenant.lease_start), "MMMM d, yyyy")} —{" "}
                          {format(new Date(viewTenant.lease_end), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Rent</p>
                      <p className="text-lg font-bold">{formatCurrency(viewTenant.monthly_rent)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Security Deposit</p>
                      <p className="text-lg font-bold">{formatCurrency(viewTenant.security_deposit)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Tenant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this tenant? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
