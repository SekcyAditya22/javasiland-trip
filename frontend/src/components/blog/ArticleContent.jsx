import { Fragment } from "react";
import SmartImage from "../SmartImage";

function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g)
    .map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      return link ? (
        <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer">
          {link[1]}
        </a>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      );
    });
}

export default function ArticleContent({ content, lang = "id" }) {
  return (
    <div className="article-content">
      {String(content || "")
        .split(/\r?\n\s*\r?\n/)
        .filter((block) => block.trim())
        .map((block, index) => {
          const lines = block.trim().split(/\r?\n/);
          const image = block
            .trim()
            .match(
              /^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/uploads\/[^\s)]+)\)$/,
            );
          if (image)
            return (
              <figure key={index}>
                <div className="article-inline-image">
                  <SmartImage
                    src={image[2]}
                    alt={image[1]}
                    lang={lang}
                    width={960}
                    sizes="(max-width: 780px) 90vw, 760px"
                  />
                </div>
                {image[1] && <figcaption>{image[1]}</figcaption>}
              </figure>
            );
          if (/^#{1,3}\s/.test(block)) {
            const Heading = block.startsWith("### ") ? "h3" : "h2";
            return (
              <Heading key={index}>
                {inline(block.replace(/^#{1,3}\s+/, ""))}
              </Heading>
            );
          }
          if (lines.every((line) => /^[-*]\s/.test(line)))
            return (
              <ul key={index}>
                {lines.map((line, position) => (
                  <li key={position}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
                ))}
              </ul>
            );
          if (lines.every((line) => /^\d+\.\s/.test(line)))
            return (
              <ol key={index}>
                {lines.map((line, position) => (
                  <li key={position}>
                    {inline(line.replace(/^\d+\.\s+/, ""))}
                  </li>
                ))}
              </ol>
            );
          if (lines.every((line) => /^>\s?/.test(line)))
            return (
              <blockquote key={index}>
                {inline(
                  lines.map((line) => line.replace(/^>\s?/, "")).join(" "),
                )}
              </blockquote>
            );
          return (
            <p key={index}>
              {lines.map((line, position) => (
                <Fragment key={position}>
                  {position > 0 && <br />}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          );
        })}
    </div>
  );
}
