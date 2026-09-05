export type Credential = {
  title: string;
  detail: string;
};

/*
 * Founder details, sourced from the OUAQT pitch deck.
 * TODO(adel): drop a headshot into /public/images/founder.jpg and set `photo`
 * below — until then the site renders an initials monogram instead.
 */
export const founder = {
  name: "Elboumby Aumar Ramdhane",
  role: "Founder & AI Product Engineer",
  location: "Nouakchott, Mauritania",
  email: "adelramdhane1@gmail.com",
  // TODO(adel): set to "/images/founder.jpg" once the file is in place.
  photo: undefined as string | undefined,
  bio: [
    "I build the systems myself — the SQL data modeling, the per-client deployments, and the full historical migrations behind all five live products.",
    "I've trained myself to run complete end-to-end builds in 24 to 48 hours, using AI tools for execution while I handle the planning and the architecture. That's what makes a system built for one business affordable for that business.",
  ],
};

export const credentials: Credential[] = [
  {
    title: "Five live systems, architected end to end",
    detail:
      "SQL data modeling, per-client deployments, and full historical migrations across mining, pharmacy, hospitality, transport, and restaurant clients.",
  },
  {
    title: "Data analytics at Deloitte and MyAiPathways",
    detail:
      "Plus a workflow automation project at SNIM that cut a three-day process down to eight hours.",
  },
  {
    title: "UNDP Knowledge Future Skills Academy winner, 2025",
    detail:
      "Keynote speaker at the Knowledge Summit in Dubai the same year.",
  },
  {
    title: "Builds in 24–48 hours, not quarters",
    detail:
      "AI handles execution; architecture and planning stay human. That speed is what makes genuinely custom software viable for an SME.",
  },
];
