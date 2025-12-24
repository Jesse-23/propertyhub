import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type MaintenanceRequest = Tables<"maintenance_requests">;
export type MaintenanceRequestInsert = TablesInsert<"maintenance_requests">;
export type MaintenanceRequestUpdate = TablesUpdate<"maintenance_requests">;

export interface MaintenanceWithDetails extends MaintenanceRequest {
  property?: {
    title: string;
    address: string;
  };
}

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: ["maintenance_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select(`
          *,
          property:properties!maintenance_requests_property_id_fkey(title, address)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as MaintenanceWithDetails[];
    },
  });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: MaintenanceRequestInsert) => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert(request)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests"] });
      toast.success("Maintenance request submitted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: MaintenanceRequestUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance_requests"] });
      toast.success("Request updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
