import { Hero } from "@/components/hero/Hero";
import { BrandStatement } from "@/components/story/BrandStatement";
import { CraftSection } from "@/components/story/CraftSection";
import { ProductUniverse } from "@/components/products/ProductUniverse";
import { ProcessStory } from "@/components/story/ProcessStory";
import { MacroDetail } from "@/components/experience/MacroDetail";
import { Benefits } from "@/components/experience/Benefits";
import { B2BPositioning } from "@/components/experience/B2BPositioning";
import { FinalCTA } from "@/components/experience/FinalCTA";
import { StitchDivider } from "@/components/ui/StitchDivider";

/**
 * One continuous scroll: opening → thesis → craft → catalogue → process →
 * detail → terms → audience → call. Section order is the narrative, so the
 * dividers carry the seam between scenes rather than hard edges.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <BrandStatement />
      <CraftSection />
      <StitchDivider label="The archive" />
      <ProductUniverse />
      <ProcessStory />
      <MacroDetail />
      <Benefits />
      <B2BPositioning />
      <FinalCTA />
    </>
  );
}
