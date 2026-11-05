import ScrollReveal from "./ScrollReveal";

export default function PageHero({ kicker, title, desc, back }) {
  return (
    <ScrollReveal as="section" className="page-hero">
      <div>
        {back}
        <p className="section-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
    </ScrollReveal>
  );
}
