import { PageHeader } from "@/components/ui";
import { ProblemForm } from "@/components/problem-form";

export default function NewProblemPage({
  searchParams,
}: {
  searchParams: { purchase_order_id?: string; shipment_id?: string };
}) {
  return (
    <div>
      <PageHeader title="Report a Problem" subtitle="Missing goods, wrong quantity, damage, faults or disputes." />
      <ProblemForm
        defaultPurchaseOrderId={searchParams.purchase_order_id}
        defaultShipmentId={searchParams.shipment_id}
      />
    </div>
  );
}
