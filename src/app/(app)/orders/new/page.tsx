import { PageHeader } from "@/components/ui";
import { OrderForm } from "@/components/order-form";

export default function NewOrderPage({
  searchParams,
}: {
  searchParams: { supplier_id?: string };
}) {
  return (
    <div>
      <PageHeader title="New Purchase Order" subtitle="Record what you ordered and from whom." />
      <OrderForm defaultSupplierId={searchParams.supplier_id} />
    </div>
  );
}
