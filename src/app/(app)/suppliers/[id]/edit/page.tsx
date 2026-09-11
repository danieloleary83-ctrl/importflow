import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { SupplierForm } from "@/components/supplier-form";

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: supplier } = await supabase.from("suppliers").select("*").eq("id", params.id).single();
  if (!supplier) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${supplier.name}`} />
      <SupplierForm supplier={supplier} />
    </div>
  );
}
