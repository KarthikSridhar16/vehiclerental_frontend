// src/pages/Home.jsx
import HeroShowcase from "../components/HeroShowcase";
import Services from "../components/Services";
import SiteFooter from "../components/SiteFooter";

export default function Home() {
  return (
    <>
      <HeroShowcase />
      <div className="v-container py-10">
        <Services />
        <SiteFooter />
      </div>
    </>
  );
}
