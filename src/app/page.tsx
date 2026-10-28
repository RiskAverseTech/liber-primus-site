import type { Metadata } from "next";
import { asReadHtml } from "@/lib/status";

export const metadata: Metadata = { title: "Liber Primus, as read" };

/**
 * The research repo's reading page (docs/liber-primus-as-read.html), fetched at
 * build time; its markup is injected as designed and its styles live in
 * globals.css under .asread.
 */
export default function ReadPage() {
  return <div className="wrap asread" dangerouslySetInnerHTML={{ __html: asReadHtml() }} />;
}
