/*
 * Founder details used on the About page. The name, role, bio and credentials
 * are translated copy and live in the dictionaries; only what is the same in
 * every language belongs here.
 *
 * Note on scope: background and credentials only. How the work gets delivered
 * internally (team size, tooling, build process) is deliberately not published.
 */
export const founder = {
  name: "Elboumby Aumar Ramdhane",
  location: "Nouakchott, Mauritania",

  /*
   * Personal contact, shown only on the founder card in About.
   * The company details (ouaqt.mrt@gmail.com, WhatsApp, the OUAQT LinkedIn
   * and Facebook pages) live in lib/data/contact.ts and are what the contact
   * page and footer use. These two are deliberately kept separate.
   */
  email: "adelramdhane1@gmail.com",
  linkedin: "https://www.linkedin.com/in/ramdhane-mohamed-ahmed-90653a1a1/",

  /*
   * The photo is picked up automatically. Save it as any of
   *   public/images/founder.jpg | .jpeg | .png | .webp
   * and the About page uses it on the next build. No code change needed.
   * See findFounderPhoto() in app/[lang]/about/page.tsx.
   */
};
