import { useEffect, useState } from "react";
import API_URL from "../api";
import FeaturedProductsSection from "../components/FeaturedProductsSection";
import HeroBanner from "../components/HeroBanner";

const sectionRenderers = {
  hero_banner: HeroBanner,
  featured_products: FeaturedProductsSection,
};

function Home() {
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSections() {
      try {
        const response = await fetch(`${API_URL}/storefront/sections`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load storefront sections");
        }

        const data = await response.json();
        setSections(Array.isArray(data.sections) ? data.sections : []);
        setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      }
    }

    loadSections();
    return () => controller.abort();
  }, []);

  if (status === "loading") {
    return <p className="storefront-message" role="status">Loading storefront…</p>;
  }

  if (status === "error") {
    return (
      <p className="storefront-message" role="alert">
        The storefront is temporarily unavailable. Please try again later.
      </p>
    );
  }

  const renderableSections = sections.filter(
    (section) => section && sectionRenderers[section.type],
  );

  if (renderableSections.length === 0) {
    return (
      <p className="storefront-message">
        The storefront is being prepared. Please check back soon.
      </p>
    );
  }

  return (
    <div className="storefront-sections">
      {renderableSections.map((section) => {
        const SectionRenderer = sectionRenderers[section.type];
        return <SectionRenderer key={section.id} section={section} />;
      })}
    </div>
  );
}

export default Home;
