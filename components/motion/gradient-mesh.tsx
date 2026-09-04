"use client";

// Abstract, restrained background element for the hero — no stock imagery.
// Two soft accent-colored blobs drift slowly behind the copy.
export function GradientMesh() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute left-1/2 top-[-10%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px] animate-float" />
      <div
        className="absolute right-[-10%] top-1/3 h-[24rem] w-[24rem] rounded-full bg-accent/10 blur-[100px] animate-float"
        style={{ animationDelay: "-6s" }}
      />
      <div className="absolute inset-0 bg-noise" />
    </div>
  );
}
