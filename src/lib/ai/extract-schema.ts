export const EXTRACT_TOOL = {
  name: "extract_purchase_data",
  description:
    "Extract structured purchase order, supplier, shipping and cost information from supplier screenshots, chat messages, invoices or tracking photos.",
  input_schema: {
    type: "object" as const,
    properties: {
      supplier: {
        type: "object",
        description: "The supplier this order is with, if identifiable.",
        properties: {
          name: { type: "string", description: "Supplier or shop name" },
          company_name: { type: "string" },
          contact_person: { type: "string" },
          phone: { type: "string" },
          wechat: { type: "string" },
          whatsapp: { type: "string" },
          link_1688: { type: "string" },
          alibaba_url: { type: "string" },
          address: { type: "string" },
        },
      },
      order: {
        type: "object",
        properties: {
          order_number: { type: "string", description: "Supplier order/invoice number if shown" },
          date_ordered: { type: "string", description: "ISO date YYYY-MM-DD if identifiable" },
          currency: { type: "string", description: "RMB, EUR, or USD" },
          exchange_rate: { type: "number", description: "RMB per 1 EUR, if shown" },
        },
      },
      items: {
        type: "array",
        description: "Every product line item found",
        items: {
          type: "object",
          properties: {
            product_name: { type: "string" },
            sku: { type: "string" },
            quantity: { type: "number" },
            unit_price_rmb: { type: "number" },
            unit_price_eur: { type: "number" },
          },
          required: ["product_name"],
        },
      },
      shipping: {
        type: "object",
        properties: {
          tracking_number: { type: "string" },
          shipping_agent: { type: "string" },
          shipping_method: { type: "string" },
          carton_count: { type: "number" },
          carton_dimensions: { type: "string" },
          weight_kg: { type: "number" },
          cbm: { type: "number" },
          date_shipped_from_china: { type: "string", description: "ISO date" },
          estimated_arrival: { type: "string", description: "ISO date" },
        },
      },
      costs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            cost_type: {
              type: "string",
              enum: [
                "china_domestic_shipping",
                "international_freight",
                "customs_duty",
                "import_vat",
                "other",
              ],
            },
            amount: { type: "number" },
            currency: { type: "string" },
          },
          required: ["cost_type", "amount"],
        },
      },
      notes: {
        type: "string",
        description: "Any other useful information: problems, promises, delivery instructions, etc.",
      },
    },
    required: ["items"],
  },
};

export interface ExtractedData {
  supplier?: {
    name?: string;
    company_name?: string;
    contact_person?: string;
    phone?: string;
    wechat?: string;
    whatsapp?: string;
    link_1688?: string;
    alibaba_url?: string;
    address?: string;
  };
  order?: {
    order_number?: string;
    date_ordered?: string;
    currency?: string;
    exchange_rate?: number;
  };
  items?: {
    product_name: string;
    sku?: string;
    quantity?: number;
    unit_price_rmb?: number;
    unit_price_eur?: number;
  }[];
  shipping?: {
    tracking_number?: string;
    shipping_agent?: string;
    shipping_method?: string;
    carton_count?: number;
    carton_dimensions?: string;
    weight_kg?: number;
    cbm?: number;
    date_shipped_from_china?: string;
    estimated_arrival?: string;
  };
  costs?: { cost_type: string; amount: number; currency?: string }[];
  notes?: string;
}
