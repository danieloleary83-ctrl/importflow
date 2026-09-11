import { PageHeader } from "@/components/ui";
import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Add Product" />
      <ProductForm />
    </div>
  );
}
