import { PageHeader } from "@/components/ui";
import { ShipmentForm } from "@/components/shipment-form";

export default function NewShipmentPage() {
  return (
    <div>
      <PageHeader
        title="New Shipment"
        subtitle="Warehouse: Shenzhen Xietong Warehouse · Shipping mark: INCH AUTOS"
      />
      <ShipmentForm />
    </div>
  );
}
