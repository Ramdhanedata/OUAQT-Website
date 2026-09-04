import { FadeIn } from "@/components/motion/fade-in";
import { team } from "@/lib/data/team";

// TODO(customize): once real headshots exist, replace the initials circle
// below with a Next.js <Image src={member.photo} /> and drop the file into
// /public/images/team/.
export function TeamGrid() {
  return (
    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
      {team.map((member, index) => {
        const initials = member.name
          .split(" ")
          .map((part) => part[0])
          .join("");

        return (
          <FadeIn key={member.name} delay={(index % 4) * 0.08}>
            <div className="bg-noise flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 via-muted to-background">
              <span className="text-2xl font-semibold tracking-tight text-foreground/30">
                {initials}
              </span>
            </div>
            <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">
              {member.name}
            </h3>
            <p className="text-sm text-accent">{member.role}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {member.bio}
            </p>
          </FadeIn>
        );
      })}
    </div>
  );
}
