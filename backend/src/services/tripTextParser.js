const cleanListItem = (line) =>
  line
    .replace(/^\*\s*/, "")
    .replace(/^[✅️✖️]+\s*/u, "")
    .trim();

const titleCase = (value) =>
  value.replace(/\b\w/g, (character) => character.toUpperCase());

const parsePrice = (line) => {
  const match = line.match(/^(\d+)\s*pax\s*-\s*([\d.]+)\s*\/\s*pax$/i);
  if (!match) return null;
  return {
    pax: Number(match[1]),
    price: Number(match[2].replaceAll(".", "")),
    season: "normal",
  };
};

const parseBlock = (lines) => ({
  itinerary: lines.filter((line) => line.startsWith("*")).map(cleanListItem),
  priceTiers: lines.map(parsePrice).filter(Boolean),
});

const findSectionEnd = (lines, startIndex) => {
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (
      /^Paket\s+[A-H]$/i.test(lines[index]) ||
      /^Paket sunrise/i.test(lines[index]) ||
      /^Custom trip/i.test(lines[index]) ||
      /^Harga paket tersebut/i.test(lines[index])
    ) {
      return index;
    }
  }
  return lines.length;
};

const getSharedFacilities = (lines) => {
  const includeStart = lines.findIndex((line) =>
    /^Harga paket tersebut sudah termasuk/i.test(line),
  );
  const excludeStart = lines.findIndex((line) =>
    /^Harga tidak termasuk/i.test(line),
  );
  const include = lines
    .slice(includeStart + 1, excludeStart)
    .filter((line) => /^[✅️]/u.test(line))
    .map(cleanListItem);
  const exclude = lines
    .slice(excludeStart + 1)
    .filter((line) => /^[✖️]/u.test(line))
    .map(cleanListItem);
  return { include, exclude };
};

export function parseTripText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const facilities = getSharedFacilities(lines);
  const jogjaVariants = [];

  lines.forEach((line, index) => {
    const match = line.match(/^Paket\s+([A-H])$/i);
    if (!match) return;
    const code = match[1].toUpperCase();
    const block = parseBlock(lines.slice(index + 1, findSectionEnd(lines, index)));
    jogjaVariants.push({
      code,
      title: `Paket ${code} · ${titleCase(block.itinerary[0] || "One Day Tour")}`,
      ...block,
    });
  });

  const parseNamedSection = (pattern, code, fallbackTitle) => {
    const index = lines.findIndex((line) => pattern.test(line));
    if (index < 0) return null;
    return {
      code,
      title: fallbackTitle,
      ...parseBlock(lines.slice(index + 1, findSectionEnd(lines, index))),
    };
  };

  return {
    jogjaVariants,
    magelang: parseNamedSection(
      /^Paket sunrise area magelang/i,
      "A",
      "Sunrise Magelang & VW Borobudur",
    ),
    dieng: parseNamedSection(
      /^Paket sunrise dieng/i,
      "A",
      "Sunrise Dieng Midnight",
    ),
    custom: {
      code: "A",
      title: "Custom Trip",
      itinerary: [
        "Konsultasi kebutuhan perjalanan",
        "Penyusunan rute dan estimasi biaya",
        "Konfirmasi jadwal bersama Owner",
      ],
      priceTiers: [],
    },
    facilities,
  };
}
