import { PageHeader } from "@/components/ui";
import { SearchClient } from "@/components/search-client";

export default function SearchPage() {
  return (
    <div>
      <PageHeader title="Search" subtitle="Search suppliers, products, orders and shipments in one place." />
      <SearchClient />
    </div>
  );
}
