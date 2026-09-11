"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, StatusBadge } from "@/components/ui";
import { AttachmentsPanel } from "@/components/attachments-panel";
import { formatDate, formatEUR } from "@/lib/utils/format";
import { PROBLEM_STATUS_LABELS, PROBLEM_TYPE_LABELS, problemStatusColor } from "@/lib/utils/status";

const STATUSES = Object.keys(PROBLEM_STATUS_LABELS);

export function ProblemDetailClient({ problemId, initialProblem }: { problemId: string; initialProblem: any }) {
  const [problem, setProblem] = useState(initialProblem);
  const [resolution, setResolution] = useState(initialProblem.resolution ?? "");
  const [refundAmount, setRefundAmount] = useState(initialProblem.refund_amount?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function updateStatus(status: string) {
    setSaving(true);
    const res = await fetch(`/api/problems/${problemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    setProblem(json.data);
    setSaving(false);
  }

  async function saveResolution() {
    setSaving(true);
    const res = await fetch(`/api/problems/${problemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resolution,
        refund_amount: refundAmount ? parseFloat(refundAmount) : null,
      }),
    });
    const json = await res.json();
    setProblem(json.data);
    setSaving(false);
  }

  return (
    <div>
      <PageHeader
        title={PROBLEM_TYPE_LABELS[problem.type] || problem.type}
        subtitle={`Reported ${formatDate(problem.date_reported)}`}
      />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <StatusBadge label={PROBLEM_STATUS_LABELS[problem.status as keyof typeof PROBLEM_STATUS_LABELS]} className={problemStatusColor(problem.status)} />
        <select
          className="input w-auto text-sm py-1.5"
          value={problem.status}
          disabled={saving}
          onChange={(e) => updateStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROBLEM_STATUS_LABELS[s as keyof typeof PROBLEM_STATUS_LABELS]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-2">What happened</h3>
            <p className="text-sm whitespace-pre-wrap">{problem.description}</p>
            <div className="flex gap-4 mt-4 pt-4 border-t border-line text-sm">
              {problem.supplier && (
                <Link href={`/suppliers/${problem.supplier.id}`} className="text-gold-dark hover:underline">
                  Supplier: {problem.supplier.name}
                </Link>
              )}
              {problem.purchase_order && (
                <Link href={`/orders/${problem.purchase_order.id}`} className="text-gold-dark hover:underline">
                  Order: {problem.purchase_order.order_number || "View"}
                </Link>
              )}
              {problem.shipment && (
                <Link href={`/shipments/${problem.shipment.id}`} className="text-gold-dark hover:underline">
                  Shipment: {problem.shipment.reference || "View"}
                </Link>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Resolution</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Resolution notes</label>
                <textarea
                  className="input"
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="e.g. Supplier agreed to refund 200 RMB, or replacement sent on next order"
                />
              </div>
              <div>
                <label className="label">Refund Amount (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input max-w-xs"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </div>
              <button onClick={saveResolution} disabled={saving} className="btn-gold">
                {saving ? "Saving..." : "Save Resolution"}
              </button>
              {problem.refund_amount > 0 && (
                <p className="text-sm text-green-700">Refunded so far: {formatEUR(problem.refund_amount)}</p>
              )}
            </div>
          </div>
        </div>

        <AttachmentsPanel entityType="problem" entityId={problemId} />
      </div>
    </div>
  );
}
