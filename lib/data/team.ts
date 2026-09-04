export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  // TODO(customize): drop a real headshot into /public/images/team/ and point to it here
  photo: string;
};

// TODO(customize): Replace with OUAQT's real team bios and photos.
export const team: TeamMember[] = [
  {
    name: "Jordan Ellis",
    role: "Co-founder & CEO",
    bio: "Previously led product at a Series C infrastructure startup. Focused on making OUAQT's tools disappear into people's workflows.",
    photo: "/images/team/jordan-ellis.jpg",
  },
  {
    name: "Priya Nandan",
    role: "Co-founder & CTO",
    bio: "Ex-distributed systems engineer. Cares more about deleting code than writing it.",
    photo: "/images/team/priya-nandan.jpg",
  },
  {
    name: "Marcus Webb",
    role: "Head of Design",
    bio: "Spent a decade designing for tools people use every day. Believes restraint is a feature.",
    photo: "/images/team/marcus-webb.jpg",
  },
  {
    name: "Sana Iqbal",
    role: "Engineering Lead",
    bio: "Builds the systems no one notices — until they'd notice if they were gone.",
    photo: "/images/team/sana-iqbal.jpg",
  },
];
