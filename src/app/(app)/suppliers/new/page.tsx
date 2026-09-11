import { PageHeader } from "@/components/ui";
import { SupplierForm } from "@/components/supplier-form";

export default function NewSupplierPage() {
  return (
    <div>
      <PageHeader title="Add Supplier" subtitle="Suppliers you enter here can be reused on every order." />
      <SupplierForm />
    </div>
  );
}
