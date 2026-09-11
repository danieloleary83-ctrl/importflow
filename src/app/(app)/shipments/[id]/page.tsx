import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShipmentDetailClient } from "@/components/shipment-detail-client";

export const dynamic = "force-dynamic";

export default async function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: shipment } = await supabase.from("shipments").select("*").eq("id", params.id).single();
  if (!shipment) notFound();

  return <ShipmentDetailClient shipmentId={params.id} initialShipment={shipment} />;
}
