import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InitializePaymentParams {
  paymentId: string;
  email: string;
  amount: number;
}

export function usePaystack() {
  const [isLoading, setIsLoading] = useState(false);

  const initializePayment = async ({ paymentId, email, amount }: InitializePaymentParams) => {
    setIsLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/payments?verify=${paymentId}`;

      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: { paymentId, email, amount, callbackUrl },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      // Redirect to Paystack checkout
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }

      return data;
    } catch (error: any) {
      console.error("Error initializing payment:", error);
      toast.error(error.message || "Failed to initialize payment");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify", {
        body: { reference },
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Payment verified successfully!");
        return data;
      } else {
        toast.error(data.message || "Payment verification failed");
        return null;
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast.error(error.message || "Failed to verify payment");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initializePayment,
    verifyPayment,
    isLoading,
  };
}
