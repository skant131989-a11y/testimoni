"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Twitter, Linkedin, Mail, MessageCircle, QrCode } from "lucide-react";

interface ShareWallProps {
  url: string;
  workspaceName: string;
  testimonialCount: number;
}

/**
 * Compact share panel for the hosted Wall of Love page.
 * One-click share to X, LinkedIn, WhatsApp, Email + copy link + QR toggle.
 */
export function ShareWall({ url, workspaceName, testimonialCount }: ShareWallProps) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const shareText = `Read what customers are saying about ${workspaceName} — ${testimonialCount} testimonials on their Wall of Love`;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const links = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(`${workspaceName} — Wall of Love`)}&body=${encodedText}%0A%0A${encodedUrl}`,
  };

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodedUrl}`;

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-bold">Share this Wall of Love</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Copy the link, share on socials, or download a QR code for print.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button onClick={copy} variant={copied ? "default" : "outline"}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy link
              </>
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={links.twitter} target="_blank" rel="noopener noreferrer">
              <Twitter className="mr-2 h-4 w-4" /> X / Twitter
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
              <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={links.email}>
              <Mail className="mr-2 h-4 w-4" /> Email
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQr((v) => !v)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {showQr ? "Hide QR" : "QR code"}
          </Button>
        </div>

        {showQr && (
          <div className="mt-2 flex flex-col items-center gap-3 rounded-lg border bg-background p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR code linking to this wall"
              width={200}
              height={200}
              className="rounded-md"
            />
            <a
              href={qrUrl}
              download={`${workspaceName}-wall-qr.png`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Download QR code
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
