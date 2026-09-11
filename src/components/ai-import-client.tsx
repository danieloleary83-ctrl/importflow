"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, Sparkles, X, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { COST_TYPE_LABELS } from "@/lib/utils/status";

interface ItemRow {
  product_id: string | null;
  product_name: string;
  sku: string;
  quantity: string;
  unit_price_rmb: string;
  unit_price_eur: string;
  matched: boolean;
}

interface CostRow {
  cost_type: string;
  amount: string;
  currency: string;
  attach_to: "order" | "shipment";
}

const COST_TYPES = Object.keys(COST_TYPE_LABELS);

export function AiImportClient() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Review state
  const [supplier, setSupplier] = useState<Record<string, string>>({});
  const [supplierMatch, setSupplierMatch] = useState<{ id: string; name: string } | null>(null);
  const [useExistingSupplier, setUseExistingSupplier] = useState(true);

  const [order, setOrder] = useState<Record<string, string>>({});
  const [orderMatch, setOrderMatch] = useState<{ id: string; order_number: string } | null>(null);
  const [useExistingOrder, setUseExistingOrder] = useState(true);

  const [items, setItems] = useState<ItemRow[]>([]);

  const [shipping, setShipping] = useState<Record<string, string>>({});
  const [shipmentMatch, setShipmentMatch] = useState<{ id: string; reference: string } | null>(null);
  const [useExistingShipment, setUseExistingShipment] = useState(true);
  const [hasShippingInfo, setHasShippingInfo] = useState(false);

  const [costs, setCosts] = useState<CostRow[]>([]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const newFiles = Array.from(fileList);
    setFiles((f) => [...f, ...newFiles]);
    newFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setPreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeFile(index: number) {
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  async function fileToBase64(file: File): Promise<{ data: string; media_type: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const data = result.split(",")[1];
        resolve({ data, media_type: file.type || "image/jpeg" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleExtract() {
    if (files.length === 0) {
      setError("Add at least one screenshot or photo first");
      return;
    }
    setExtracting(true);
    setError(null);

    try {
      const images = await Promise.all(files.map(fileToBase64));
      const res = await fetch("/api/ai-import/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, notes }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Extraction failed");
        setExtracting(false);
        return;
      }

      const ex = json.extracted ?? {};
      const matches = json.matches ?? {};

      setSupplier({
        name: ex.supplier?.name ?? "",
        company_name: ex.supplier?.company_name ?? "",
        contact_person: ex.supplier?.contact_person ?? "",
        phone: ex.supplier?.phone ?? "",
        wechat: ex.supplier?.wechat ?? "",
        whatsapp: ex.supplier?.whatsapp ?? "",
        link_1688: ex.supplier?.link_1688 ?? "",
        alibaba_url: ex.supplier?.alibaba_url ?? "",
        address: ex.supplier?.address ?? "",
      });
      setSupplierMatch(matches.supplier ?? null);
      setUseExistingSupplier(!!matches.supplier);

      setOrder({
        order_number: ex.order?.order_number ?? "",
        date_ordered: ex.order?.date_ordered ?? "",
        currency: ex.order?.currency ?? "RMB",
        exchange_rate: ex.order?.exchange_rate?.toString() ?? "",
      });
      setOrderMatch(matches.purchase_order ?? null);
      setUseExistingOrder(!!matches.purchase_order);

      const productMatches = matches.products ?? [];
      setItems(
        (ex.items ?? []).map((it: any, i: number) => {
          const pm = productMatches[i];
          return {
            product_id: pm?.id ?? null,
            product_name: it.product_name ?? "",
            sku: it.sku ?? pm?.sku ?? "",
            quantity: it.quantity?.toString() ?? "1",
            unit_price_rmb: it.unit_price_rmb?.toString() ?? "",
            unit_price_eur: it.unit_price_eur?.toString() ?? "",
            matched: !!pm,
          };
        })
      );

      const sh = ex.shipping ?? {};
      setHasShippingInfo(Object.keys(sh).length > 0);
      setShipping({
        tracking_number: sh.tracking_number ?? "",
        shipping_agent: sh.shipping_agent ?? "",
        shipping_method: sh.shipping_method ?? "",
        carton_count: sh.carton_count?.toString() ?? "",
        carton_dimensions: sh.carton_dimensions ?? "",
        weight_kg: sh.weight_kg?.toString() ?? "",
        cbm: sh.cbm?.toString() ?? "",
        date_shipped_from_china: sh.date_shipped_from_china ?? "",
        estimated_arrival: sh.estimated_arrival ?? "",
      });
      setShipmentMatch(matches.shipment ?? null);
      setUseExistingShipment(!!matches.shipment);

      setCosts(
        (ex.costs ?? []).map((c: any) => ({
          cost_type: c.cost_type,
          amount: c.amount?.toString() ?? "",
          currency: c.currency ?? "EUR",
          attach_to: "order" as const,
        }))
      );

      setNotes(ex.notes ?? notes);
      setStep("review");
    } catch (err: any) {
      setError(err.message || "Something went wrong reading those files");
    } finally {
      setExtracting(false);
    }
  }

  function updateItem(i: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addItem() {
    setItems((rows) => [
      ...rows,
      { product_id: null, product_name: "", sku: "", quantity: "1", unit_price_rmb: "", unit_price_eur: "", matched: false },
    ]);
  }

  function addCost() {
    setCosts((rows) => [...rows, { cost_type: COST_TYPES[0], amount: "", currency: "EUR", attach_to: "order" }]);
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);

    const rate = parseFloat(order.exchange_rate) || 0;

    const payload = {
      supplier: useExistingSupplier && supplierMatch ? { id: supplierMatch.id } : supplier,
      order: {
        ...(useExistingOrder && orderMatch ? { id: orderMatch.id } : {}),
        order_number: order.order_number,
        date_ordered: order.date_ordered || null,
        currency: order.currency || "RMB",
        exchange_rate: order.exchange_rate ? parseFloat(order.exchange_rate) : null,
      },
      items: items
        .filter((it) => it.product_name)
        .map((it) => {
          const unitRmb = parseFloat(it.unit_price_rmb) || 0;
          const unitEur = it.unit_price_eur
            ? parseFloat(it.unit_price_eur)
            : rate > 0
            ? Math.round((unitRmb / rate) * 10000) / 10000
            : null;
          return {
            product_id: it.product_id,
            product_name: it.product_name,
            sku: it.sku || null,
            quantity: parseFloat(it.quantity) || 0,
            unit_price_rmb: unitRmb || null,
            unit_price_eur: unitEur,
          };
        }),
      shipping: hasShippingInfo
        ? {
            ...(useExistingShipment && shipmentMatch ? { id: shipmentMatch.id } : {}),
            tracking_number: shipping.tracking_number || undefined,
            shipping_agent: shipping.shipping_agent || undefined,
            shipping_method: shipping.shipping_method || undefined,
            carton_count: shipping.carton_count ? parseInt(shipping.carton_count) : undefined,
            carton_dimensions: shipping.carton_dimensions || undefined,
            weight_kg: shipping.weight_kg ? parseFloat(shipping.weight_kg) : undefined,
            cbm: shipping.cbm ? parseFloat(shipping.cbm) : undefined,
            date_shipped_from_china: shipping.date_shipped_from_china || undefined,
            estimated_arrival: shipping.estimated_arrival || undefined,
          }
        : null,
      costs: costs
        .filter((c) => c.amount)
        .map((c) => ({ cost_type: c.cost_type, amount: parseFloat(c.amount) || 0, currency: c.currency, attach_to: c.attach_to })),
    };

    const res = await fetch("/api/ai-import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "Something went wrong saving this");
      setConfirming(false);
      return;
    }

    // Upload the original screenshots/photos as attachments on the order
    // (and shipment, if one was created/updated).
    const supabase = createClient();
    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `purchase_order/${json.order_id}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
      if (!uploadError) {
        await fetch("/api/attachments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity_type: "purchase_order",
            entity_id: json.order_id,
            file_path: path,
            file_name: file.name,
            file_type: file.type,
          }),
        });
      }
    }

    setConfirming(false);
    router.push(`/orders/${json.order_id}`);
    router.refresh();
  }

  if (step === "upload") {
    return (
      <div className="max-w-2xl space-y-4">
        <div
          className="card border-dashed border-2 border-line text-center py-12 cursor-pointer hover:border-gold transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto text-neutral-400 mb-3" size={32} />
          <p className="font-semibold">Upload screenshots or photos</p>
          <p className="text-sm text-neutral-500 mt-1">
            1688, Alibaba, WeChat orders, tracking screenshots, invoices, packing lists...
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-24 object-cover rounded-xl border border-line" />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 bg-ink text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label">Anything else to mention? (optional)</label>
          <textarea
            className="input"
            rows={2}
            placeholder="e.g. this is the tracking update for order INV-2024-081"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <button onClick={handleExtract} disabled={extracting || files.length === 0} className="btn-gold">
          <Sparkles size={16} /> {extracting ? "Reading..." : "Extract with AI"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
        <CheckCircle2 size={16} className="text-gold-dark shrink-0" />
        Review what the AI found below, correct anything that looks wrong, then confirm to save.
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Supplier</h3>
          {supplierMatch && (
            <label className="text-xs flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={useExistingSupplier}
                onChange={(e) => setUseExistingSupplier(e.target.checked)}
              />
              Use existing: <strong>{supplierMatch.name}</strong>
            </label>
          )}
        </div>
        {!useExistingSupplier && (
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(supplier).map(([key, value]) => (
              <div key={key}>
                <label className="text-[10px] uppercase text-neutral-400">{key.replace(/_/g, " ")}</label>
                <input
                  className="input text-sm"
                  value={value}
                  onChange={(e) => setSupplier((s) => ({ ...s, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Order Details</h3>
          {orderMatch && (
            <label className="text-xs flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={useExistingOrder}
                onChange={(e) => setUseExistingOrder(e.target.checked)}
              />
              Update existing order <strong>{orderMatch.order_number}</strong>
            </label>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase text-neutral-400">Order Number</label>
            <input className="input text-sm" value={order.order_number} onChange={(e) => setOrder((o) => ({ ...o, order_number: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400">Date Ordered</label>
            <input type="date" className="input text-sm" value={order.date_ordered} onChange={(e) => setOrder((o) => ({ ...o, date_ordered: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400">Currency</label>
            <input className="input text-sm" value={order.currency} onChange={(e) => setOrder((o) => ({ ...o, currency: e.target.value }))} />
          </div>
          <div>
            <label className="text-[10px] uppercase text-neutral-400">Exchange Rate (RMB per 1 EUR)</label>
            <input type="number" step="0.0001" className="input text-sm" value={order.exchange_rate} onChange={(e) => setOrder((o) => ({ ...o, exchange_rate: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Items</h3>
          <button onClick={addItem} className="btn-secondary text-xs py-1.5 px-3">
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end border-b border-line pb-3 last:border-0">
              <div className="col-span-12 sm:col-span-5">
                <label className="text-[10px] uppercase text-neutral-400">
                  Product {it.matched && <span className="text-green-600">(matched existing)</span>}
                </label>
                <input className="input text-sm" value={it.product_name} onChange={(e) => updateItem(i, { product_name: e.target.value })} />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <label className="text-[10px] uppercase text-neutral-400">Qty</label>
                <input type="number" className="input text-sm" value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-[10px] uppercase text-neutral-400">Unit RMB</label>
                <input type="number" step="0.01" className="input text-sm" value={it.unit_price_rmb} onChange={(e) => updateItem(i, { unit_price_rmb: e.target.value })} />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-[10px] uppercase text-neutral-400">Unit EUR</label>
                <input type="number" step="0.01" className="input text-sm" value={it.unit_price_eur} onChange={(e) => updateItem(i, { unit_price_eur: e.target.value })} />
              </div>
              <div className="col-span-1">
                <button onClick={() => setItems((rows) => rows.filter((_, idx) => idx !== i))} className="text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-neutral-400">No items found - add one manually if needed.</p>}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Shipping</h3>
          <label className="text-xs flex items-center gap-1.5">
            <input type="checkbox" checked={hasShippingInfo} onChange={(e) => setHasShippingInfo(e.target.checked)} />
            Include shipping info
          </label>
        </div>
        {hasShippingInfo && (
          <>
            {shipmentMatch && (
              <label className="text-xs flex items-center gap-1.5 mb-3">
                <input type="checkbox" checked={useExistingShipment} onChange={(e) => setUseExistingShipment(e.target.checked)} />
                Update existing shipment <strong>{shipmentMatch.reference || shipmentMatch.id.slice(0, 8)}</strong>
              </label>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(shipping).map(([key, value]) => (
                <div key={key}>
                  <label className="text-[10px] uppercase text-neutral-400">{key.replace(/_/g, " ")}</label>
                  <input
                    className="input text-sm"
                    type={key.startsWith("date_") || key === "estimated_arrival" ? "date" : "text"}
                    value={value}
                    onChange={(e) => setShipping((s) => ({ ...s, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Costs</h3>
          <button onClick={addCost} className="btn-secondary text-xs py-1.5 px-3">
            <Plus size={14} /> Add Cost
          </button>
        </div>
        <div className="space-y-2">
          {costs.map((c, i) => (
            <div key={i} className="flex gap-2 items-end flex-wrap">
              <select
                className="input text-sm w-auto"
                value={c.cost_type}
                onChange={(e) => setCosts((rows) => rows.map((r, idx) => (idx === i ? { ...r, cost_type: e.target.value } : r)))}
              >
                {COST_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {COST_TYPE_LABELS[ct]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                className="input text-sm w-28"
                placeholder="Amount"
                value={c.amount}
                onChange={(e) => setCosts((rows) => rows.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)))}
              />
              <select
                className="input text-sm w-auto"
                value={c.attach_to}
                onChange={(e) => setCosts((rows) => rows.map((r, idx) => (idx === i ? { ...r, attach_to: e.target.value as "order" | "shipment" } : r)))}
              >
                <option value="order">On this order</option>
                <option value="shipment">On the shipment</option>
              </select>
              <button onClick={() => setCosts((rows) => rows.filter((_, idx) => idx !== i))} className="text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {costs.length === 0 && <p className="text-sm text-neutral-400">No costs found.</p>}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
        <button onClick={handleConfirm} disabled={confirming} className="btn-gold">
          {confirming ? "Saving..." : "Confirm and Save"}
        </button>
        <button onClick={() => setStep("upload")} className="btn-secondary">
          Back
        </button>
      </div>
    </div>
  );
}
