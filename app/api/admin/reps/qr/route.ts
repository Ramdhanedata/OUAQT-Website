import { NextResponse } from "next/server";
import { adminGate } from "@/builder/admin/guard";
import { repQrPng } from "@/builder/admin/reps";
import { adminClient } from "@/builder/db/server";

/*
 * A representative's QR code as a PNG to save, print or send: 1200 pixels,
 * enough for a poster. Named after them, so a folder of them stays readable.
 */
export async function GET(request: Request) {
  const gate = await adminGate();
  if (!gate.allowed) return NextResponse.json({ error: gate.reason }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  const supabase = adminClient();
  if (!supabase) return NextResponse.json({ error: "no_database" }, { status: 503 });
  const { data: rep } = /^[0-9a-f-]{36}$/i.test(id)
    ? await supabase.from("representatives").select("name, code").eq("id", id).maybeSingle()
    : { data: null };
  if (!rep) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const png = await repQrPng(rep.code as string);
  const name = String(rep.name).normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "") || "representative";
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="OUAQT-QR-${name}-${rep.code}.png"`,
      "cache-control": "no-store",
    },
  });
}
