// deno.d.ts must be in the same folder

// @ts-ignore
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req: Request) => {
  const { reference, tenant_id, property_id, amount } = await req.json();

  const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    }
  );

  const result = await verifyRes.json();

  if (result.data.status === "success") {
    await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/payments`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""}`,
  },
  body: JSON.stringify({
    tenant_id,
    property_id,
    amount,
    payment_reference: reference,
    payment_status: "paid",
    payment_method: "paystack",
    description: "PropertyHub payment",
  }),
});


    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ success: false }), { status: 400 });
});
