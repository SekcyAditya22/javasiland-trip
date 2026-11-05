// Keep retained variant IDs stable so editing/deleting one option does not
// detach bookings belonging to another option.
export async function syncPackageVariants(tx, packageId, variants, formatVariant) {
  const existing = await tx.packageVariant.findMany({ where: { packageId }, select: { id: true, code: true } });
  const ids = new Set();
  const codes = new Set();
  const invalid = (message) => { throw Object.assign(new Error(message), { status: 400 }); };
  const prepared = variants.map((variant, index) => {
    const data = formatVariant(variant, index);
    data.code = String(data.code).trim().toUpperCase();
    if (!data.code || codes.has(data.code)) invalid('Kode varian harus diisi dan tidak boleh sama.');
    codes.add(data.code);
    const previous = variant.id != null ? existing.find((item) => item.id === Number(variant.id)) : undefined;
    if (variant.id != null && !previous) invalid('Varian tidak ditemukan pada paket ini. Muat ulang data sebelum menyimpan.');
    if (previous && ids.has(previous.id)) invalid('Varian yang sama tidak boleh dikirim dua kali.');
    if (previous) ids.add(previous.id);
    return { data, previous };
  });
  await tx.packageVariant.deleteMany({ where: { packageId, ...(ids.size ? { id: { notIn: [...ids] } } : {}) } });
  // Reserve temporary codes first, allowing two retained variants to swap codes.
  for (const { previous, data } of prepared) {
    if (previous && previous.code !== data.code) await tx.packageVariant.update({ where: { id: previous.id }, data: { code: `__editing_${previous.id}` } });
  }
  for (const { previous, data } of prepared) {
    if (previous) {
      await tx.variantPriceTier.deleteMany({ where: { variantId: previous.id } });
      await tx.packageVariant.update({ where: { id: previous.id }, data });
    } else {
      await tx.packageVariant.create({ data: { ...data, packageId } });
    }
  }
}
