import { adminGate } from "@/builder/admin/guard";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { PaymentsToConfirm, type PaymentRow } from "@/builder/admin/payments";
import { adminClient } from "@/builder/db/server";

/*
 * Payments waiting for a person.
 *
 * This is the page that matters most in the admin area, so it is the one at
 * the address staff will type. Everything is read here, on the server, with
 * the service role. The browser is handed what it needs to draw the screen
 * and a short-lived link to each image, never a key.
 */
export default async function AdminPage() {
  const gate = await adminGate();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) {
    return <p className="text-base text-foreground">No database configured.</p>;
  }

  const { data: payments } = await supabase
    .from("payments")
    .select("id, business_id, plan, expected_amount, reference, status, screenshot_path, created_at")
    .in("status", ["submitted", "pending_confirmation"])
    .order("created_at", { ascending: true })
    .limit(50);

  const businessIds = Array.from(
    new Set((payments ?? []).map((payment) => payment.business_id))
  );

  const { data: businesses } = businessIds.length
    ? await supabase
        .from("businesses")
        .select("id, name_latin, pack, launch_client")
        .in("id", businessIds)
    : { data: [] };

  const byId = new Map((businesses ?? []).map((one) => [one.id, one]));

  /*
   * A link that works for a few minutes and then stops. The bucket is private
   * and nothing here hands out a permanent address to somebody's receipt.
   */
  const MINUTES = 10 * 60; // not-a-rule: how long a signed link lives
  const rows: PaymentRow[] = await Promise.all(
    (payments ?? []).map(async (payment) => {
      const signed = await supabase.storage
        .from("payments")
        .createSignedUrl(payment.screenshot_path, MINUTES);

      const business = byId.get(payment.business_id);
      return {
        id: payment.id,
        businessName: business?.name_latin ?? "",
        pack: business?.pack ?? "",
        launchClient: Boolean(business?.launch_client),
        plan: payment.plan,
        expected: Number(payment.expected_amount),
        reference: payment.reference,
        status: payment.status,
        receivedAt: payment.created_at,
        screenshotUrl: signed.data?.signedUrl ?? null,
      };
    })
  );

  return (
    <>
      <header className="mb-8 flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground">
          Paiements à confirmer
        </h1>
        <span className="text-base text-muted-foreground">
          {gate.staff.name ?? "staff"}
        </span>
      </header>
      <PaymentsToConfirm rows={rows} />
    </>
  );
}
