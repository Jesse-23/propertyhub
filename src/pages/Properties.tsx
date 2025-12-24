import { useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useProperties, useCreateProperty, useUpdateProperty, useDeleteProperty, Property, PropertyInsert } from "@/hooks/useProperties";
import { useAuth } from "@/contexts/AuthContext";
import PropertyCard from "@/components/properties/PropertyCard";
import PropertyForm from "@/components/properties/PropertyForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building2, MapPin, Bed, Bath, Square, Loader2 } from "lucide-react";

export default function Properties() {
  const { role } = useAuth();
  const { data: properties, isLoading } = useProperties();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);
  const [viewProperty, setViewProperty] = useState<Property | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const canManage = role === "admin" || role === "property_manager";

  const filteredProperties = properties?.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase()) ||
      property.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async (data: PropertyInsert) => {
    await createProperty.mutateAsync(data);
  };

  const handleUpdate = async (data: PropertyInsert) => {
    if (selectedProperty) {
      await updateProperty.mutateAsync({ id: selectedProperty.id, ...data });
    }
  };

  const handleDelete = async () => {
    if (propertyToDelete) {
      await deleteProperty.mutateAsync(propertyToDelete);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  const openEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormOpen(true);
  };

  const openDelete = (id: string) => {
    setPropertyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Properties</h1>
            <p className="text-muted-foreground mt-1">
              {properties?.length || 0} properties in your portfolio
            </p>
          </div>
          {canManage && (
            <Button onClick={() => { setSelectedProperty(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
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
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredProperties?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No properties found</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Add your first property to get started"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties?.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={openEdit}
                onDelete={openDelete}
                onView={setViewProperty}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        <PropertyForm
          open={formOpen}
          onClose={() => { setFormOpen(false); setSelectedProperty(null); }}
          onSubmit={selectedProperty ? handleUpdate : handleCreate}
          property={selectedProperty}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Property</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this property? This action cannot be undone and will
                remove all associated tenant and payment records.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Property Detail */}
        <Dialog open={!!viewProperty} onOpenChange={() => setViewProperty(null)}>
          <DialogContent className="max-w-2xl">
            {viewProperty && (
              <>
                <DialogHeader>
                  <DialogTitle>{viewProperty.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {viewProperty.images && viewProperty.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {viewProperty.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="h-40 w-auto rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {viewProperty.address}, {viewProperty.city}, {viewProperty.state}
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Bed className="h-4 w-4" /> {viewProperty.bedrooms} Bedrooms
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" /> {viewProperty.bathrooms} Bathrooms
                    </span>
                    {viewProperty.area_sqft && (
                      <span className="flex items-center gap-1">
                        <Square className="h-4 w-4" /> {viewProperty.area_sqft} sqft
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between py-3 border-y">
                    <span className="text-lg font-bold text-accent">
                      {formatCurrency(viewProperty.rent_amount)}/month
                    </span>
                    <Badge className="capitalize">{viewProperty.status}</Badge>
                  </div>
                  {viewProperty.description && (
                    <p className="text-muted-foreground">{viewProperty.description}</p>
                  )}
                  {viewProperty.amenities && viewProperty.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {viewProperty.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
