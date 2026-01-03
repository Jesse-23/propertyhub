import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Property, PropertyInsert, uploadPropertyImage } from "@/hooks/useProperties";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, Loader2 } from "lucide-react";

const propertySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().default("Nigeria"),
  property_type: z.string().min(1, "Property type is required"),
  bedrooms: z.coerce.number().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  area_sqft: z.coerce.number().min(0).optional(),
  rent_amount: z.coerce.number().min(1, "Rent amount is required"),
  status: z.enum(["available", "occupied", "maintenance"]).default("available"),
  amenities: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PropertyInsert) => Promise<void>;
  property?: Property | null;
}

const propertyTypes = [
  "Apartment",
  "House",
  "Duplex",
  "Studio",
  "Penthouse",
  "Commercial",
  "Office",
];

const amenitiesList = [
  "Air Conditioning",
  "Parking",
  "Swimming Pool",
  "Gym",
  "Security",
  "Generator",
  "Water Supply",
  "Internet",
];

export default function PropertyForm({ open, onClose, onSubmit, property }: PropertyFormProps) {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>(property?.images || []);
  const [uploading, setUploading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenities || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: property
      ? {
          title: property.title,
          description: property.description || "",
          address: property.address,
          city: property.city,
          state: property.state || "",
          country: property.country || "Nigeria",
          property_type: property.property_type,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          area_sqft: property.area_sqft || undefined,
          rent_amount: property.rent_amount,
          status: property.status || "available",
          amenities: property.amenities || [],
        }
      : {
          country: "Nigeria",
          status: "available",
        },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadPropertyImage(file));
      const urls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const onFormSubmit = async (data: PropertyFormData) => {
    await onSubmit({
      title: data.title,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      property_type: data.property_type,
      rent_amount: data.rent_amount,
      status: data.status,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      area_sqft: data.area_sqft,
      description: data.description,
      images,
      amenities: selectedAmenities,
      manager_id: user?.id,
    });
    reset();
    setImages([]);
    setSelectedAmenities([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "Add New Property"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Images */}
          <div className="space-y-2">
            <Label>Property Images</Label>
            <div className="flex flex-wrap gap-3">
              {images.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-destructive-foreground" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} placeholder="Beautiful 3 Bedroom Apartment" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={watch("property_type")}
                onValueChange={(value) => setValue("property_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase()}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.property_type && (
                <p className="text-sm text-destructive">{errors.property_type.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value: "available" | "occupied" | "maintenance") =>
                  setValue("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" type="number" {...register("bedrooms")} min={0} />
            </div>

            {/* Bathrooms */}
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" type="number" {...register("bathrooms")} min={0} />
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="area_sqft">Area (sqft)</Label>
              <Input id="area_sqft" type="number" {...register("area_sqft")} min={0} />
            </div>

            {/* Rent */}
            <div className="space-y-2">
              <Label htmlFor="rent_amount">Monthly Rent (₦)</Label>
              <Input id="rent_amount" type="number" {...register("rent_amount")} min={1} />
              {errors.rent_amount && (
                <p className="text-sm text-destructive">{errors.rent_amount.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="123 Main Street" />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} placeholder="Lagos" />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} placeholder="Lagos State" />
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the property..."
                rows={4}
              />
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedAmenities.includes(amenity)
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {property ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
