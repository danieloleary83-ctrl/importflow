import { PageHeader } from "@/components/ui";
import { AiImportClient } from "@/components/ai-import-client";

export default function AiImportPage() {
  return (
    <div>
      <PageHeader
        title="AI Import"
        subtitle="Upload screenshots, photos or supplier chat messages. Claude reads them and fills in the details for you."
      />
      <AiImportClient />
    </div>
  );
}
