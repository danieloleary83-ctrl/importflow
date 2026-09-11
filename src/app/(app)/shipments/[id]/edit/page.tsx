import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ShipmentForm } from "@/components/shipment-form";

export default async function EditShipmentPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: shipment } = await supabase.from("shipments").select("*").eq("id", params.id).single();
  if (!shipment) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${shipment.reference || "Shipment"}`} />
      <ShipmentForm shipment={shipment} />
    </div>
  );
}
