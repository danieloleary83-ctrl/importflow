import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/product-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", params.id).single();
  if (!product) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${product.name}`} />
      <ProductForm product={product} />
    </div>
  );
}
