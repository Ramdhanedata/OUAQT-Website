import { deviceCodeFor } from "@/app-ui/codes";
import { adminGate } from "@/builder/admin/guard";
import { AdminNav } from "@/builder/admin/nav";
import { adminWords } from "@/builder/admin/language";
import { Devices, type DeviceRow } from "@/builder/admin/devices";
import { AdminSignIn } from "@/builder/admin/sign-in";
import { adminClient } from "@/builder/db/server";

/*
 * Every computer that has activated, with the code it shows on its own
 * screen, so a person on the phone can be matched to a row here.
 */
export default async function DevicesPage() {
  const gate = await adminGate();
  const { t, locale } = await adminWords();
  if (!gate.allowed) return <AdminSignIn reason={gate.reason} />;

  const supabase = adminClient();
  if (!supabase) return <p className="text-base">{t.noDatabase}</p>;

  const { data: devices } = await supabase
    .from("devices")
    .select("business_id, device_id, name, platform, role, status, last_seen")
    .order("last_seen", { ascending: false })
    .limit(100);

  const businessIds = Array.from(new Set((devices ?? []).map((one) => one.business_id)));
  const { data: businesses } = businessIds.length
    ? await supabase.from("businesses").select("id, name_latin").in("id", businessIds)
    : { data: [] };

  const names = new Map((businesses ?? []).map((one) => [one.id, one.name_latin]));

  const rows: DeviceRow[] = await Promise.all(
    (devices ?? []).map(async (device) => ({
      businessId: device.business_id,
      businessName: names.get(device.business_id) ?? "",
      deviceId: device.device_id,
      deviceCode: await deviceCodeFor(device.device_id),
      name: device.name,
      platform: device.platform,
      role: device.role,
      status: device.status,
      lastSeen: device.last_seen,
    }))
  );

  return (
    <>
      <AdminNav current="/admin/postes" staff={gate.staff.name ?? t.staffFallback} />
      <h1 className="text-2xl font-semibold text-foreground">{t.devices.title}</h1>
      <Devices rows={rows} words={{ t: t.devices, roles: t.roles, locale }} />
    </>
  );
}
