import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrderDetailClient } from "@/components/order-detail-client";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("purchase_orders")
    .select("*, supplier:suppliers(id,name,phone,wechat)")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  return <OrderDetailClient orderId={params.id} initialOrder={order} />;
}
