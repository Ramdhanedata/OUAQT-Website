export type Credential = {
  title: string;
  detail: string;
};

/*
 * Founder details for the About page.
 *
 * Note on scope: this covers background and credentials only. How the work
 * gets delivered internally (team size, tooling, build process) is
 * deliberately not published.
 */
export const founder = {
  name: "Elboumby Aumar Ramdhane",
  role: "Founder & AI Product Engineer",
  location: "Nouakchott, Mauritania",
  linkedin:
    "https://www.linkedin.com/in/ramdhane-mohamed-ahmed-90653a1a1/",
  /*
   * The photo is picked up automatically. Save it as any of
   *   public/images/founder.jpg | .jpeg | .png | .webp
   * and the About page uses it on the next build. No code change needed.
   * See findFounderPhoto() in app/about/page.tsx.
   */
  bio: [
    "I started OUAQT after watching capable businesses lose hours every day to work their software should have been handling for them. Not complicated work. Just counting, copying, and checking numbers by hand because nothing they had been sold fit the way they actually operated.",
    "My background is in data analytics and product engineering. I stay close to every project, from the first conversation about how a business really runs to the system that finally replaces the spreadsheet.",
  ],
};

export const credentials: Credential[] = [
  {
    title: "Data analytics at Deloitte and MyAiPathways",
    detail:
      "Consulting and product work on how organizations collect, model, and actually use their data.",
  },
  {
    title: "Workflow automation at SNIM",
    detail:
      "Rebuilt a three day process so it finished in eight hours, on one of Mauritania's largest industrial operations.",
  },
  {
    title: "UNDP Knowledge Future Skills Academy winner, 2025",
    detail:
      "Selected from the regional cohort, and keynote speaker at the Knowledge Summit in Dubai the same year.",
  },
  {
    title: "Systems live across five sectors",
    detail:
      "Mining, pharmacy, hospitality, transport, and food service, each running on its own dedicated deployment.",
  },
];
