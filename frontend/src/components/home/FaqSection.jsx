import { ChevronDown } from "lucide-react";
import ScrollReveal from "../ScrollReveal";

export default function FaqSection({ faqs, lang }) {
  return (
    <ScrollReveal as="section" className="section faq-section" id="faq">
      <div className="section-head compact">
        <p className="section-kicker">FAQ</p>
        <h2>
          {lang === "en"
            ? "Questions, answered."
            : "Pertanyaan yang sering ditanyakan."}
        </h2>
      </div>
      <div className="accordion-list">
        {faqs.slice(0, 8).map((faq) => (
          <details key={faq.id}>
            <summary>
              {lang === "en" ? faq.enQuestion || faq.question : faq.question}
              <ChevronDown size={17} />
            </summary>
            <p>{lang === "en" ? faq.enAnswer || faq.answer : faq.answer}</p>
          </details>
        ))}
      </div>
    </ScrollReveal>
  );
}
