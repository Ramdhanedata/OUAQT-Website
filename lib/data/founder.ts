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
  email: "adelramdhane1@gmail.com",
  /*
   * TODO(adel): save your photo to public/images/founder.jpg, then change the
   * line below to:  photo: "/images/founder.jpg" as string | undefined,
   * A square crop works best. Until then the page shows an initials monogram.
   */
  photo: undefined as string | undefined,
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
