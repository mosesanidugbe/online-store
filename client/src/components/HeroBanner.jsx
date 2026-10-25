function HeroBanner({ section }) {
  const settings = section.settings ?? {};
  const heading = settings.heading || section.title;
  const description = settings.description;
  const imageUrl = settings.image_url;
  const ctaLabel = settings.cta_label;
  const ctaHref = settings.cta_href;

  return (
    <section
      className="storefront-hero"
      style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
    >
      <div className="storefront-hero-content">
        <h1>{heading}</h1>
        {description ? <p>{description}</p> : null}
        {ctaLabel && ctaHref ? (
          <a className="storefront-hero-cta" href={ctaHref}>
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export default HeroBanner;
