import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { imageUrl, imageSrcSet } from "../lib/images";

function ImageRequest({
  src,
  srcSet,
  sizes,
  alt,
  className,
  imageClassName,
  imageStyle,
  loading,
  priority,
  lang,
  onSettled,
}) {
  const [phase, setPhase] = useState(src ? "loading" : "error");
  const ref = useRef(null);
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const finish = (next) => {
    setPhase(next);
    settled.current?.(next);
  };
  useEffect(() => {
    if (ref.current?.complete)
      finish(ref.current.naturalWidth ? "loaded" : "error");
  }, [src]);
  return (
    <div
      className={`smart-image ${className || ""}`}
      data-state={phase}
      aria-busy={phase === "loading"}
    >
      {phase === "loading" && (
        <span className="smart-image-placeholder skeleton" aria-hidden="true" />
      )}
      <img
        ref={ref}
        className={imageClassName}
        style={imageStyle}
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? "eager" : loading}
        fetchpriority={priority ? "high" : undefined}
        decoding="async"
        onLoad={() => finish("loaded")}
        onError={() => finish("error")}
        aria-hidden={phase === "error" ? true : undefined}
      />
      {phase === "error" && (
        <span className="smart-image-error" role="img" aria-label={alt}>
          <ImageOff size={22} aria-hidden="true" />
          <span>
            {lang === "en" ? "Image unavailable" : "Gambar belum tersedia"}
          </span>
        </span>
      )}
    </div>
  );
}

export default function SmartImage({
  src,
  alt = "",
  className,
  imageClassName,
  imageStyle,
  loading = "lazy",
  priority = false,
  lang = "id",
  width = 720,
  sizes = "100vw",
  responsive = true,
  onSettled,
}) {
  const resolved = src ? imageUrl(src, width) : undefined;
  return (
    <ImageRequest
      key={resolved}
      src={resolved}
      srcSet={responsive ? imageSrcSet(src) : undefined}
      sizes={sizes}
      alt={alt}
      className={className}
      imageClassName={imageClassName}
      imageStyle={imageStyle}
      loading={loading}
      priority={priority}
      lang={lang}
      onSettled={onSettled}
    />
  );
}
