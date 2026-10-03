import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatMoney } from "@/app-ui";
import { deviceCodeFor } from "@/app-ui/codes";
import { daysLeft, type LicencePlan } from "@/app-ui/licence-status";
import { wordFor } from "@/builder/admin/copy";
import { Devices, type DeviceRow } from "@/builder/admin/devices";
import { adminGate } from "@/builder/admin/guard";
import { adminWords } from "@/builder/admin/language";
import { LicenceControls } from "@/builder/admin/licence-controls";
import { LiveRefresh } from "@/builder/admin/live";
import { AdminNav } from "@/builder/admin/nav";
import { actionWords, describeTrail } from "@/builder/admin/overview";
import { ago, latestLicences, shopStatus, type LicenceRow } from "@/builder/admin/overview-math";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { StatusBadge } from "@/builder/admin/status-badge";
import { phoneKey } from "@/builder/config-code/code";
import { adminClient } from "@/builder/db/server";
import { PHONE_DOMAIN } from "@/builder/ui/login-domain";
import { getPublicSettings } from "@/builder/db/settings";
import { fill } from "@/lib/utils";
import { growthCopy } from "@/builder/admin/copy-growth";
import { AssignRep } from "@/builder/admin/rep-forms";

/*
 * One client, everything we hold about it on one page, and the decisions
 * staff can take about it.
 *
 * What we hold is the shop's name, its owner's contact, its licence, the
 * computers that activated, what it paid and the trail. Its sales, stock and
 * customers live on its own computers and are not here to show.
 */

const COUNTRY = "222"; // not-a-rule: the one country the product is sold in

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ClientPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const gate = await adminGate();
  const { lang, t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const c = t.client;
  const nav = <AdminNav current="/admin/clients" here={`/admin/clients/${id}`} staff={gate.staff.name ?? t.staffFallback} />;
  const back = (
    <Link href="/admin/clients" className="inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft aria-hidden className="h-4 w-4 rtl:rotate-180" />
      {c.back}
    </Link>
  );

  const { data: business } = UUID.test(id)
    ? await supabase
        .from("businesses")
        .select("id, owner_id, name_latin, name_arabic, pack, app_language, receipt_phone, receipt_address, launch_client, created_at, representative_id")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  if (!business) {
    return (
      <>
        {nav}
        {back}
        <p className="mt-4 text-base text-foreground">{c.notFound}</p>
      </>
    );
  }

  const [settings, { data: licenceRows }, { data: devices }, { data: payments }, { data: draft }, { data: owner }, { data: reps }] = await Promise.all([
    getPublicSettings(),
    supabase
      .from("licences")
      .select("id, business_id, plan, status, starts_at, ends_at, created_at, grace_days, gift")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("devices")
      .select("business_id, device_id, name, platform, role, status, last_seen")
      .eq("business_id", business.id)
      .order("last_seen", { ascending: false }),
    supabase
      .from("payments")
      .select("id, plan, expected_amount, status, created_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("builder_drafts").select("phone").eq("business_id", business.id).not("phone", "is", null).limit(1).maybeSingle(),
    supabase.auth.admin.getUserById(business.owner_id),
    supabase.from("representatives").select("id, name, code, active").order("name"),
  ]);

  const now = new Date();
  const rules = { renewalGraceDays: settings?.renewal_grace_days ?? 0 };
  const licence = latestLicences((licenceRows ?? []) as LicenceRow[]).get(business.id);
  const status = shopStatus(licence, now, rules);
  const left = licence?.ends_at
    ? daysLeft({ plan: licence.plan as LicencePlan, startsAt: null, endsAt: new Date(licence.ends_at) }, now)
    : null;

  /* The trail of this shop: rows about it, its licences, its payments and its computers. */
  const subjects = [
    business.id,
    ...(licenceRows ?? []).map((one) => one.id as string),
    ...(payments ?? []).map((one) => one.id as string),
    ...(devices ?? []).map((one) => one.device_id as string),
  ];
  const { data: trailRows } = await supabase
    .from("audit_events")
    .select("id, actor_id, subject, subject_id, action, detail, created_at")
    .in("subject_id", subjects)
    .order("created_at", { ascending: false })
    .limit(40);
  const trail = await describeTrail(supabase, trailRows ?? [], new Map([[business.id, business.name_latin]]), licenceRows ?? []);

  const deviceRows: DeviceRow[] = await Promise.all(
    (devices ?? []).map(async (device) => ({
      businessId: device.business_id,
      businessName: business.name_latin,
      deviceId: device.device_id,
      deviceCode: await deviceCodeFor(device.device_id),
      name: device.name,
      platform: device.platform,
      role: device.role,
      status: device.status,
      lastSeen: device.last_seen,
    }))
  );

  /*
   * Whichever number we have: the one given in the builder, then the one on
   * the receipt, then the account's. An owner's login is his phone written as
   * an address on our own domain, so that one is a phone, not an email.
   */
  const login = owner?.user?.email ?? null;
  const loginIsPhone = Boolean(login?.endsWith(`@${PHONE_DOMAIN}`));
  const phone =
    phoneKey(draft?.phone) ??
    phoneKey(business.receipt_phone) ??
    phoneKey(owner?.user?.phone) ??
    (loginIsPhone ? phoneKey(login?.split("@")[0]) : null);
  const email = login && !loginIsPhone ? login : null;
  const date = (value: string | null) => (value ? new Date(value).toLocaleDateString(locale) : null);

  const activeDevices = deviceRows.filter((one) => one.status === "active");
  const lastSeen = activeDevices.map((one) => one.lastSeen).sort().at(-1) ?? null;
  const confirmed = (payments ?? []).filter((one) => one.status === "confirmed");
  const number = new Intl.NumberFormat(locale);

  return (
    <>
      {nav}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        {back}
        <LiveRefresh drawnAt={now.toISOString()} words={{ live: t.overview.live, refresh: t.overview.refresh }} locale={locale} />
      </div>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{business.name_latin}</h1>
          {business.name_arabic ? (
            <p className="mt-1 text-xl text-foreground" dir="rtl" lang="ar">
              {business.name_arabic}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {wordFor(t.packs, business.pack)}
            {" · "}
            {fill(c.since, { date: date(business.created_at) ?? "" })}
            {business.launch_client ? ` · ${c.launch}` : ""}
          </p>
        </div>
        <StatusBadge status={status} label={status ? wordFor(t.statuses, status) : t.clients.noLicence} />
      </header>

      {/* Four figures about this shop, readable from across the room. */}
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure
          label={c.ends}
          value={
            licence?.ends_at
              ? left !== null && left > 0
                ? fill(c.daysLeftShort, { days: number.format(left) })
                : date(licence.ends_at) ?? ""
              : licence?.plan === "trial"
                ? "—"
                : c.noEnd
          }
          sub={licence?.ends_at ? date(licence.ends_at) ?? "" : licence?.plan === "trial" ? c.notStarted : ""}
        />
        <Figure label={c.plan} value={licence ? wordFor(t.plans, licence.plan) : "—"} sub={status ? wordFor(t.statuses, status) : ""} />
        <Figure
          label={c.devicesTitle}
          value={number.format(activeDevices.length)}
          sub={lastSeen ? fill(t.clients.seen, { ago: ago(lastSeen, now, lang) }) : t.clients.neverSeen}
        />
        <Figure
          label={c.paymentsTitle}
          value={number.format(confirmed.length)}
          sub={formatMoney(confirmed.reduce((sum, one) => sum + Number(one.expected_amount), 0), lang)}
        />
      </ul>

      <Card title={c.controlsTitle} className="mt-4">
        <LicenceControls
          businessId={business.id}
          businessName={business.name_latin}
          suspended={status === "suspended"}
          hasLicence={Boolean(licence)}
          perpetual={licence?.plan === "perpetual"}
          endsAt={licence?.ends_at ?? null}
          graceDays={rules.renewalGraceDays}
          words={{ t: c, plans: t.plans, locale }}
        />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={c.licenceTitle}>
          {licence ? (
            <dl className="space-y-2">
              <Line label={c.plan} value={wordFor(t.plans, licence.plan)} />
              <Line label={c.status} value={status ? wordFor(t.statuses, status) : ""} />
              <Line label={c.starts} value={date(licence.starts_at) ?? c.notStarted} />
              <Line
                label={c.ends}
                value={
                  licence.ends_at
                    ? `${date(licence.ends_at)}${left !== null && left > 0 ? ` · ${fill(c.daysLeft, { days: left })}` : ""}`
                    : licence.plan === "trial"
                      ? c.notStarted
                      : c.noEnd
                }
              />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{c.noLicence}</p>
          )}
        </Card>

        <Card title={c.contactTitle}>
          {phone || email ? (
            <dl className="space-y-2">
              {phone ? (
                <Line
                  label={c.phone}
                  value={
                    <a
                      href={`https://wa.me/${COUNTRY}${phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-border underline-offset-4 hover:decoration-foreground"
                    >
                      <bdi dir="ltr">{`+${COUNTRY} ${phone.replace(/(\d{2})(?=\d)/g, "$1 ")}`}</bdi>
                      {` · ${c.whatsapp}`}
                    </a>
                  }
                />
              ) : null}
              {email ? <Line label={c.email} value={<bdi dir="ltr">{email}</bdi>} /> : null}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{c.noContact}</p>
          )}
          {business.receipt_address ? <p className="mt-3 text-sm text-muted-foreground">{business.receipt_address}</p> : null}
          {/* Who brought this shop: set by their QR code, or here by hand. */}
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">{growthCopy[lang].reps.assignTitle}</h3>
            <AssignRep
              t={growthCopy[lang].reps}
              businessId={business.id}
              current={(business.representative_id as string | null) ?? null}
              reps={(reps ?? []).map((one) => ({ id: one.id as string, name: one.name as string, code: one.code as string, active: Boolean(one.active) }))}
            />
          </div>
        </Card>
      </div>

      <Card title={c.devicesTitle} className="mt-4">
        {/* The list brings its own top margin, which the card's title already gives. */}
        <div className={deviceRows.length ? "-mt-6" : "-mt-3"}>
          <Devices rows={deviceRows} words={{ t: t.devices, roles: t.roles, locale }} />
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title={c.paymentsTitle}>
          {(payments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.noPayments}</p>
          ) : (
            <ul className="divide-y divide-border">
              {(payments ?? []).map((payment) => (
                <li key={payment.id}>
                  {/* Each one opens its own page: the screenshot, the checks, the refund, its history. */}
                  <Link
                    href={`/admin/paiements/${payment.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 hover:bg-muted/40"
                  >
                    <span className="text-[15px] text-foreground">
                      <span className="font-semibold">{formatMoney(Number(payment.expected_amount), lang)}</span>
                      <span className="text-muted-foreground"> · {wordFor(t.plans, payment.plan)}</span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {wordFor(c.paymentStatuses, payment.status)} · {date(payment.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={c.historyTitle}>
          {trail.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.noHistory}</p>
          ) : (
            <ol className="space-y-3">
              {trail.map((one) => (
                <li key={one.id} className="flex gap-3">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span className="min-w-0 flex-1 text-[15px] text-foreground">
                    {actionWords(t.actions, one)}
                    <span className="block text-sm text-muted-foreground" title={new Date(one.at).toLocaleString(locale)}>
                      {one.actor === null ? t.overview.automatic : one.actor || t.staffFallback} · {ago(one.at, now, lang)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}

function Card({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5">
      <span className="block text-sm text-muted-foreground">{label}</span>
      <span className="mt-2 block truncate text-2xl font-semibold tracking-tight text-foreground">{value}</span>
      <span className="mt-1 block truncate text-sm text-muted-foreground">{sub}</span>
    </li>
  );
}

function Line({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-x-3 text-[15px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{value}</dd>
    </div>
  );
}
