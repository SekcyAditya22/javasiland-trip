import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import useCarousel from "../hooks/useCarousel";
import { imageList, imageUrl } from "../lib/images";
import SmartImage from "./SmartImage";
import { imageFrameStyle } from "../lib/media";

export default function ImageCarousel({
  images: source,
  title,
  href,
  lang = "id",
  badge,
  detail = false,
  autoPlay = !detail,
  intervalSeconds = 5,
  priority = false,
  imageSettings,
  aspectRatio,
  thumbnails = detail,
  className = "",
}) {
  const images = imageList(source);
  const sourceKey = JSON.stringify(images);
  const [loadedImage, setLoadedImage] = useState(null);
  const carousel = useCarousel({
    count: images.length,
    sourceKey,
    autoPlay,
    intervalSeconds,
    readyIndex: images.indexOf(loadedImage),
  });
  const { index, select } = carousel;
  const touchStart = useRef(null);
  const swiped = useRef(false);
  const en = lang === "en";
  useEffect(() => {
    const connection = navigator.connection;
    if (
      !carousel.visible ||
      images.length < 2 ||
      loadedImage !== images[index] ||
      connection?.saveData ||
      ["slow-2g", "2g"].includes(connection?.effectiveType)
    )
      return;
    // Warm only the next slide, using the same resolution the browser selected.
    const currentSrc = carousel.ref.current?.querySelector(
      ".image-carousel-image",
    )?.currentSrc;
    let width = detail ? 960 : 640;
    try {
      width = Number(new URL(currentSrc).searchParams.get("w")) || width;
    } catch {
      /* Keep the default width. */
    }
    const next = new Image();
    next.decoding = "async";
    next.fetchPriority = "low";
    next.src = imageUrl(images[(index + 1) % images.length], width);
  }, [sourceKey, index, loadedImage, carousel.visible, detail]);
  const picture = images.length ? (
    <SmartImage
      key={images[index]}
      imageClassName="image-carousel-image"
      imageStyle={imageFrameStyle(imageSettings, images[index])}
      src={images[index]}
      alt={`${title} · ${index + 1}`}
      loading={detail ? "eager" : "lazy"}
      priority={detail || priority}
      lang={lang}
      width={detail ? 960 : 640}
      sizes={
        detail
          ? "(max-width: 780px) 90vw, 48vw"
          : "(max-width: 780px) 90vw, (max-width: 1080px) 45vw, 400px"
      }
      onSettled={() => setLoadedImage(images[index])}
    />
  ) : (
    <div className="image-carousel-empty">
      <ImageOff size={30} />
      <span>{en ? "No image yet" : "Gambar belum tersedia"}</span>
    </div>
  );

  return (
    <div
      className={`image-carousel ${detail ? "image-carousel--detail" : "image-carousel--card"} ${className}`}
      ref={carousel.ref}
      role="group"
      aria-roledescription={en ? "carousel" : "karusel"}
      aria-label={`${en ? "Gallery" : "Galeri"} ${title}`}
      {...carousel.interactionProps}
    >
      <div
        className="image-carousel-stage"
        style={aspectRatio ? { aspectRatio, height: "auto" } : undefined}
        onTouchStart={(event) => {
          touchStart.current = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          };
          swiped.current = false;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current !== null && images.length > 1) {
            const distance =
              event.changedTouches[0].clientX - touchStart.current.x;
            const verticalDistance =
              event.changedTouches[0].clientY - touchStart.current.y;
            if (
              Math.abs(distance) > 45 &&
              Math.abs(distance) > Math.abs(verticalDistance)
            ) {
              swiped.current = true;
              select(index + (distance < 0 ? 1 : -1));
            }
          }
          touchStart.current = null;
        }}
        onTouchCancel={() => {
          touchStart.current = null;
          swiped.current = false;
        }}
        onClickCapture={(event) => {
          if (swiped.current) {
            event.preventDefault();
            event.stopPropagation();
            swiped.current = false;
          }
        }}
      >
        {href ? (
          <Link className="image-carousel-link" to={href}>
            {picture}
          </Link>
        ) : (
          picture
        )}
        {badge}
        {images.length > 1 && (
          <>
            <span className="image-carousel-count" aria-live="off">
              {index + 1} / {images.length}
            </span>
            <button
              type="button"
              className="image-carousel-arrow previous"
              onClick={() => select(index - 1)}
              aria-label={en ? "Previous image" : "Gambar sebelumnya"}
            >
              <ChevronLeft size={20} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              className="image-carousel-arrow next"
              onClick={() => select(index + 1)}
              aria-label={en ? "Next image" : "Gambar berikutnya"}
            >
              <ChevronRight size={20} strokeWidth={2.25} />
            </button>
            {!detail && (
              <div className="image-carousel-bottom">
                <div className="image-carousel-dots">
                  {images.map((image, position) => (
                    <button
                      type="button"
                      key={image}
                      className={position === index ? "active" : ""}
                      aria-label={`${en ? "View image" : "Lihat gambar"} ${position + 1}`}
                      aria-current={position === index ? "true" : undefined}
                      onClick={() => select(position)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {thumbnails && images.length > 1 && (
        <div
          className="gallery-strip"
          aria-label={en ? "Choose an image" : "Pilih gambar"}
        >
          {images.map((image, position) => (
            <button
              type="button"
              key={image}
              className={position === index ? "active" : ""}
              aria-label={`${en ? "View image" : "Lihat gambar"} ${position + 1}`}
              aria-pressed={position === index}
              onClick={() => select(position)}
            >
              <SmartImage
                src={image}
                imageStyle={imageFrameStyle(imageSettings, image)}
                alt=""
                loading="lazy"
                width={160}
                responsive={false}
                lang={lang}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
