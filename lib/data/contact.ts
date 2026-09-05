/*
 * OUAQT's public contact details. Used by the contact page and the footer.
 * Edit here and both update.
 */
export const organization = {
  email: "ouaqt.mrt@gmail.com",

  // Displayed as written; `whatsappUrl` strips the spaces and the plus so
  // wa.me accepts it (country code 222 + the local number).
  phoneDisplay: "+222 26 40 65 68",
  whatsappUrl: "https://wa.me/22226406568",

  linkedin: "https://www.linkedin.com/company/ouaqt/",

  /*
   * TODO(adel): please double check this one. You sent a Facebook share link
   * full of tracking parameters (mibextid, rdid, share_url). Stripping those
   * leaves the handle below, but "ngoulk.something" looks unusual for a page
   * URL, so open it once and confirm it lands on the OUAQT page. The share
   * link also pointed at facebook.com/share/1bF8Lx5ps8/ if this one is wrong.
   */
  facebook: "https://www.facebook.com/ngoulk.something",

  location: "Nouakchott, Mauritania",
};

export type SocialLink = { href: string; label: string };

export const socialLinks: SocialLink[] = [
  { href: organization.linkedin, label: "LinkedIn" },
  { href: organization.facebook, label: "Facebook" },
  { href: organization.whatsappUrl, label: "WhatsApp" },
];
