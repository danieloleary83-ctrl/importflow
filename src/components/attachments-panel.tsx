"use client";

import { useEffect, useState, useRef } from "react";
import { Paperclip, Upload, Trash2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AttachmentEntityType } from "@/lib/types/database";

interface AttachmentRow {
  id: string;
  file_path: string;
  file_name: string | null;
  file_type: string | null;
  uploaded_at: string;
  url: string | null;
}

export function AttachmentsPanel({
  entityType,
  entityId,
}: {
  entityType: AttachmentEntityType;
  entityId: string;
}) {
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(
      `/api/attachments?entity_type=${entityType}&entity_id=${entityId}`
    );
    const json = await res.json();
    setAttachments(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();

    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${entityType}/${entityId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          file_path: path,
          file_name: file.name,
          file_type: file.type,
        }),
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this attachment?")) return;
    await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Paperclip size={16} /> Attachments
        </h3>
        <label className="btn-secondary cursor-pointer text-xs py-1.5 px-3">
          <Upload size={14} /> {uploading ? "Uploading..." : "Upload"}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading...</p>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No attachments yet. Upload screenshots, photos, invoices or packing lists.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attachments.map((a) => {
            const isImage = a.file_type?.startsWith("image/");
            return (
              <div key={a.id} className="relative group border border-line rounded-xl overflow-hidden">
                {isImage && a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.file_name ?? ""} className="w-full h-24 object-cover" />
                ) : (
                  <a
                    href={a.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center h-24 bg-surface text-neutral-400"
                  >
                    <FileText size={22} />
                  </a>
                )}
                <div className="p-1.5 text-[11px] truncate text-neutral-600 flex items-center justify-between gap-1">
                  <span className="truncate flex-1">{a.file_name ?? "file"}</span>
                  <button onClick={() => handleDelete(a.id)} className="text-red-500 shrink-0">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
