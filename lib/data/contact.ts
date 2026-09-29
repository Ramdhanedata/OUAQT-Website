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

  facebook: "https://www.facebook.com/ouaqt",

  // Headquarters. Shown on the site, and the Organization's address in search structured data.
  location: "Nouakchott, Mauritania",
};

/* Labels come from dict.common, so each language names the network its own way. */
export type SocialLink = { href: string; key: "linkedin" | "facebook" | "whatsapp" };

export const socialLinks: SocialLink[] = [
  { href: organization.linkedin, key: "linkedin" },
  { href: organization.facebook, key: "facebook" },
  { href: organization.whatsappUrl, key: "whatsapp" },
];
