import "server-only";

import type { LicencePayload } from "@/app-ui/licence-file";
import { signLicence } from "./sign";
import { statusOf, type Licence, type LicencePlan } from "./status";

/*
 * Turning what the database knows into the file a shop runs on.
 *
 * Every rule the app needs goes in, read from settings at the moment of
 * issue: the device ceiling, the grace after a licence lapses, how much clock
 * drift to forgive, how many computers an owner may free himself. The app is
 * then correct on its own, with the shutter down and no signal, which is the
 * only condition that matters.
 *
 * not-a-rule-file: how long a file is good for before the app asks again is a
 * freshness window, not a commercial term.
 */

/** A file older than this asks for a new one. Shorter than any grace period. */
const REFRESH_AFTER_DAYS = 7;
const MS_IN_A_DAY = 86_400_000;

export type IssueInput = {
  businessId: string;
  businessName: string;
  licence: {
    plan: LicencePlan;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
    updatesUntil: string | null;
    renewalSecret: string;
  };
  devices: { device_id: string; role: string }[];
  rules: {
    maxDevices: number;
    renewalGraceDays: number;
    clockGraceDays: number;
    deviceReleasesPerYear: number;
  };
  now?: Date;
};

export function licencePayload(input: IssueInput): LicencePayload {
  const now = input.now ?? new Date();

  const shape: Licence = {
    plan: input.licence.plan,
    startsAt: input.licence.startsAt ? new Date(input.licence.startsAt) : null,
    endsAt: input.licence.endsAt ? new Date(input.licence.endsAt) : null,
    suspended: input.licence.status === "suspended",
  };

  return {
    version: 1,
    businessId: input.businessId,
    businessName: input.businessName,
    plan: input.licence.plan,
    /*
     * Worked out here rather than copied from the column, for the same reason
     * the account page works it out: a status nobody has touched since last
     * year says whatever it said last year.
     */
    status: statusOf(shape, now, { renewalGraceDays: input.rules.renewalGraceDays }),
    startsAt: input.licence.startsAt,
    endsAt: input.licence.endsAt,
    updatesUntil: input.licence.updatesUntil,
    maxDevices: input.rules.maxDevices,
    renewalGraceDays: input.rules.renewalGraceDays,
    clockGraceDays: input.rules.clockGraceDays,
    deviceReleasesPerYear: input.rules.deviceReleasesPerYear,
    renewalSecret: input.licence.renewalSecret,
    devices: input.devices.map((device) => ({
      deviceId: device.device_id,
      role: device.role === "main" ? "main" : "secondary",
    })),
    issuedAt: now.toISOString(),
    refreshAfter: new Date(now.getTime() + REFRESH_AFTER_DAYS * MS_IN_A_DAY).toISOString(),
  };
}

export async function issueLicence(input: IssueInput) {
  return signLicence(licencePayload(input));
}
