import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Tenant = Tables<"tenants">;
export type TenantInsert = TablesInsert<"tenants">;
export type TenantUpdate = TablesUpdate<"tenants">;

export interface TenantWithProfile extends Tenant {
  profile?: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  property?: {
    title: string;
    address: string;
  };
}

export function useTenants() {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          profile:profiles!tenants_user_id_fkey(full_name, email, phone),
          property:properties!tenants_property_id_fkey(title, address)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as TenantWithProfile[];
    },
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenants", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select(`
          *,
          profile:profiles!tenants_user_id_fkey(full_name, email, phone),
          property:properties!tenants_property_id_fkey(title, address)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as unknown as TenantWithProfile;
    },
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenant: TenantInsert) => {
      const { data, error } = await supabase
        .from("tenants")
        .insert(tenant)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TenantUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("tenants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant removed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
