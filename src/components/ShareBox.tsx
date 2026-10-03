"use client";

import { useEffect, useState } from "react";
import { shareUrl } from "@/lib/proposals";

export function ShareBox({ id, recipientName }: { id: string; recipientName: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(shareUrl(id));
    setCanShare(typeof navigator.share === "function");
  }, [id]);

  const message = `${recipientName ? `${recipientName}, ` : ""}I have a question for you 💌`;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input readOnly value={url} className="input font-mono text-sm" onFocus={(e) => e.currentTarget.select()} aria-label="Share link" />
        <button type="button" className="btn-primary shrink-0 !px-5" onClick={() => void copy()}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          className="btn-secondary !py-2 text-sm"
          href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Send on WhatsApp
        </a>
        {canShare && (
          <button
            type="button"
            className="btn-secondary !py-2 text-sm"
            onClick={() => void navigator.share({ title: "A question for you 💌", text: message, url }).catch(() => {})}
          >
            Share…
          </button>
        )}
        <a className="btn-secondary !py-2 text-sm" href={url} target="_blank" rel="noopener noreferrer">
          Open link ↗
        </a>
      </div>
    </div>
  );
}
