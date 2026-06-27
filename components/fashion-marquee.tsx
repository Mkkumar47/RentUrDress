import { Marquee } from "@/components/ui/marquee";

const fashionTags = [
  "Designer Lehengas",
  "Evening Gowns",
  "Bridesmaid Looks",
  "Reception Sarees",
  "Cocktail Drapes",
  "Indo-Western Fits",
  "Pastel Couture",
  "Runway Collection",
];

function TagChip({ label }: { label: string }) {
  return (
    <div className="mx-2 rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 shadow-[0_8px_20px_rgba(15,23,42,0.35)]">
      {label}
    </div>
  );
}

export function FashionMarquee() {
  return (
    <div className="space-y-2">
      <Marquee pauseOnHover className="[--duration:26s]">
        {fashionTags.map((tag) => (
          <TagChip key={`row-a-${tag}`} label={tag} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:30s]">
        {fashionTags.map((tag) => (
          <TagChip key={`row-b-${tag}`} label={tag} />
        ))}
      </Marquee>
    </div>
  );
}
