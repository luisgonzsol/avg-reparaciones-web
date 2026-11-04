import { Hero } from "@/components/sections/hero";
import { TrustBar } from "@/components/sections/trust-bar";
import { ServicesGrid } from "@/components/sections/services-grid";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Brands } from "@/components/sections/brands";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { AboutSummary } from "@/components/sections/about-summary";
import { Testimonials } from "@/components/sections/testimonials";
import { Coverage } from "@/components/sections/coverage";
import { Faq } from "@/components/sections/faq";
import { Contact } from "@/components/sections/contact";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <ServicesGrid />
      <HowItWorks />
      <Brands />
      <FeaturedProducts />
      <AboutSummary />
      <Testimonials />
      <Coverage />
      <Faq />
      <Contact />
    </>
  );
}
