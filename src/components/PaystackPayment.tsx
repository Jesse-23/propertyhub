/// <reference types="vite/client" />
import React, { useState } from "react";

type PaystackPaymentProps = {
  email: string;
  amount: number; // in Naira
  tenant_id: string;
  property_id: string;
};

export default function PaystackPayment({
  email,
  amount,
  tenant_id,
  property_id,
}: PaystackPaymentProps) {
  const [loading, setLoading] = useState(false);

  // Function to open Paystack modal
  const payWithPaystack = () => {
    if (loading) return; // Prevent multiple clicks
    setLoading(true);

    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100, // convert Naira to kobo
      currency: "NGN",
      callback: (response: any) => {
        verifyPayment(response.reference);
      },
      onClose: () => {
        setLoading(false);
        alert("Payment window closed.");
      },
    });

    handler.openIframe();
  };

  // Function to call Supabase Edge Function and verify payment
  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch(import.meta.env.VITE_SUPABASE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          tenant_id,
          property_id,
          amount,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Payment successful!");
      } else {
        alert("Payment verification failed.");
      }
    } catch (err) {
      console.error("Error verifying payment:", err);
      alert("An error occurred while verifying payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={payWithPaystack}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay ₦${amount.toLocaleString()}`}
    </button>
  );
}
