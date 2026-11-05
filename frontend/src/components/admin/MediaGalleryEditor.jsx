import { useState } from "react";
import { imageList } from "../../lib/images";
import ImageGalleryInput from "./ImageGalleryInput";
import ImageFramingEditor from "./ImageFramingEditor";

export default function MediaGalleryEditor({
  value,
  onChange,
  onBusyChange,
  disabled = false,
}) {
  const images = imageList(value.image, value.gallery);
  const [selected, setSelected] = useState(value.image);
  const current = images.includes(selected) ? selected : images[0];
  return (
    <div className="media-gallery-editor">
      <ImageGalleryInput
        maxImages={31}
        image={value.image}
        gallery={value.gallery}
        disabled={disabled}
        onBusyChange={onBusyChange}
        selectedImage={current}
        onSelectImage={setSelected}
        onChange={(next) => {
          const sources = imageList(next.image, next.gallery);
          onChange({
            ...next,
            imageSettings: {
              ratio: value.imageSettings?.ratio || "16/9",
              items: (value.imageSettings?.items || []).filter((item) =>
                sources.includes(item.src),
              ),
            },
          });
        }}
      />
      {current && (
        <ImageFramingEditor
          src={current}
          settings={value.imageSettings}
          disabled={disabled}
          onChange={(imageSettings) => onChange({ imageSettings })}
        />
      )}
    </div>
  );
}
