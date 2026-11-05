import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { selectHomepageIds } from "../src/data/catalogHomepage.js";
import { createApiClient } from "./helpers/api.js";

test("homepage catalog settings persist, preserve order, filter drafts, and protect admin changes", async () => {
  const prefix = `home-catalog-${randomUUID().slice(0, 8)}`;
  const original = await prisma.catalogHomepageSettings.findMany();
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const request = createApiClient(
    `http://127.0.0.1:${server.address().port}/api`,
  );
  const vehicleIds = [];
  try {
    const password = randomUUID();
    await prisma.adminUser.create({
      data: {
        username: prefix,
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 10),
      },
    });
    assert.equal(
      (await request("/admin/catalog-homepage/packages")).status,
      401,
    );
    assert.equal(
      (
        await request("/admin/catalog-homepage/fleet", {
          method: "PUT",
          body: {},
        })
      ).status,
      401,
    );
    const { cookie } = await request("/auth/login", {
      method: "POST",
      body: { username: prefix, password },
    });
    for (const [index, status, area] of [
      [0, "PUBLISHED", "Dieng"],
      [1, "PUBLISHED", "Jogja"],
      [2, "PUBLISHED", "Solo"],
      [3, "DRAFT", "Dieng"],
      [4, "PUBLISHED", "Malaysia"],
      [5, "PUBLISHED", "Semarang"],
    ]) {
      const id = `${prefix}-${index}`;
      await prisma.package.create({
        data: {
          id,
          slug: id,
          title: id,
          enTitle: id,
          area,
          status,
          description: "",
          enDescription: "",
        },
      });
    }
    for (let i = 0; i < 4; i++) {
      const item = await prisma.vehicle.create({
        data: { name: `${prefix}-${i}`, type: "MPV", specs: [] },
      });
      vehicleIds.push(String(item.id));
    }
    const initial = (
      await request("/admin/catalog-homepage/packages", { cookie })
    ).data;
    const settings = {
      ...initial,
      title: "Pilihan perjalanan",
      enTitle: "Selected trips",
      mode: "MANUAL",
      visible: true,
      selectedIds: [`${prefix}-2`, `${prefix}-0`, `${prefix}-1`],
    };
    const save = (kind, body) =>
      request(`/admin/catalog-homepage/${kind}`, {
        cookie,
        method: "PUT",
        body,
      });
    assert.equal((await save("packages", settings)).status, 200);
    assert.deepEqual(
      (await request("/admin/catalog-homepage/packages", { cookie })).data,
      { ...settings, kind: "packages" },
    );
    const publicCatalog = async () => (await request("/public/bootstrap")).data;
    let catalog = await publicCatalog();
    assert.deepEqual(
      catalog.homepageCatalog.packages.selectedIds,
      settings.selectedIds,
    );
    assert.equal(catalog.homepageCatalog.packages.enTitle, "Selected trips");
    const rotating = {
      ...settings,
      selectedIds: [
        `${prefix}-5`,
        `${prefix}-2`,
        `${prefix}-0`,
        `${prefix}-1`,
        `${prefix}-3`,
      ],
      imageAutoPlay: false,
      imageIntervalSeconds: 2,
      rotateItems: true,
      rotationIntervalSeconds: 5,
    };
    assert.equal((await save("packages", rotating)).status, 200);
    const storedPlayback = (
      await request("/admin/catalog-homepage/packages", { cookie })
    ).data;
    assert.deepEqual(storedPlayback.selectedIds, rotating.selectedIds);
    assert.equal(storedPlayback.imageAutoPlay, false);
    assert.equal(storedPlayback.imageIntervalSeconds, 2);
    assert.equal(storedPlayback.rotateItems, true);
    assert.equal(storedPlayback.rotationIntervalSeconds, 5);
    catalog = await publicCatalog();
    assert.deepEqual(
      catalog.homepageCatalog.packages.selectedIds,
      rotating.selectedIds.slice(0, 3),
    );
    assert.deepEqual(
      catalog.homepageCatalog.packages.rotationIds,
      rotating.selectedIds.slice(0, 4),
    );
    assert.equal(catalog.homepageCatalog.packages.imageAutoPlay, false);
    for (const patch of [
      { imageAutoPlay: "false" },
      { imageAutoPlay: null },
      { rotateItems: 1 },
      { imageIntervalSeconds: 1 },
      { imageIntervalSeconds: 61 },
      { imageIntervalSeconds: 2.5 },
      { imageIntervalSeconds: "5" },
      { rotationIntervalSeconds: 4 },
      { rotationIntervalSeconds: 121 },
      { selectedIds: Array(31).fill(`${prefix}-0`) },
    ])
      assert.equal(
        (await save("packages", { ...rotating, ...patch })).status,
        400,
      );
    // Older clients may update selection without supplying playback fields.
    assert.equal(
      (
        await save("packages", {
          mode: "AUTO",
          visible: true,
          title: settings.title,
          enTitle: settings.enTitle,
          selectedIds: [],
        })
      ).status,
      200,
    );
    assert.equal(
      (await request("/admin/catalog-homepage/packages", { cookie })).data
        .imageIntervalSeconds,
      2,
    );
    assert.equal(
      (await request("/admin/catalog-homepage/packages", { cookie })).data
        .rotateItems,
      true,
    );
    assert.equal(
      catalog.packages.some((item) => item.id === `${prefix}-3`),
      false,
    );

    const draftSelection = [`${prefix}-3`, `${prefix}-1`, `${prefix}-0`];
    assert.equal(
      (await save("packages", { ...settings, selectedIds: draftSelection }))
        .status,
      200,
    );
    assert.deepEqual(
      (await request("/admin/catalog-homepage/packages", { cookie })).data
        .selectedIds,
      draftSelection,
    );
    assert.deepEqual(
      (await publicCatalog()).homepageCatalog.packages.selectedIds,
      draftSelection.slice(1),
    );
    assert.equal(
      (await save("packages", { ...settings, selectedIds: [`${prefix}-4`] }))
        .status,
      400,
    );
    assert.equal(
      (await save("packages", { ...settings, selectedIds: ["missing-record"] }))
        .status,
      400,
    );
    assert.equal(
      (
        await save("packages", {
          ...settings,
          selectedIds: [settings.selectedIds[0], settings.selectedIds[0]],
        })
      ).status,
      400,
    );
    assert.equal(
      (await save("packages", { ...settings, selectedIds: [0, 1, 2, 3] }))
        .status,
      400,
    );
    assert.equal(
      (await save("packages", { ...settings, mode: "POPULAR" })).status,
      400,
    );
    assert.equal(
      (await save("packages", { ...settings, visible: "false" })).status,
      400,
    );
    assert.equal((await save("unknown", settings)).status, 404);
    assert.equal(
      (await save("packages", { ...settings, visible: false })).status,
      200,
    );
    assert.equal(
      (await publicCatalog()).homepageCatalog.packages.visible,
      false,
    );

    const fleetSettings = {
      mode: "MANUAL",
      title: "Armada pilihan",
      enTitle: "Selected fleet",
      visible: true,
      selectedIds: vehicleIds.slice(1).reverse(),
    };
    assert.equal((await save("fleet", fleetSettings)).status, 200);
    assert.deepEqual(
      (await publicCatalog()).homepageCatalog.fleet.selectedIds,
      fleetSettings.selectedIds,
    );
    assert.equal(
      (await save("fleet", { ...fleetSettings, selectedIds: ["999999999999"] }))
        .status,
      400,
    );
    await prisma.vehicle.delete({
      where: { id: Number(fleetSettings.selectedIds[0]) },
    });
    assert.deepEqual(
      (await request("/admin/catalog-homepage/fleet", { cookie })).data
        .selectedIds,
      fleetSettings.selectedIds.slice(1),
    );
    assert.deepEqual(
      (await publicCatalog()).homepageCatalog.fleet.selectedIds,
      fleetSettings.selectedIds.slice(1),
    );

    const choices = [
      { id: "a", area: "Jogja" },
      { id: "draft", area: "Jogja", status: "DRAFT" },
      { id: "my", area: "MALAYSIA" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ];
    assert.deepEqual(
      selectHomepageIds({ kind: "packages", mode: "AUTO" }, choices),
      ["a", "b", "c"],
    );
    for (let i = 0; i < 20; i++) {
      const random = selectHomepageIds(
        { kind: "packages", mode: "RANDOM" },
        choices,
      );
      assert.equal(random.length, 3);
      assert.equal(new Set(random).size, 3);
      assert.ok(random.every((id) => ["a", "b", "c", "d"].includes(id)));
    }
    assert.equal(
      (
        await save("fleet", {
          ...fleetSettings,
          mode: "RANDOM",
          selectedIds: [],
        })
      ).status,
      200,
    );
    catalog = await publicCatalog();
    assert.equal(catalog.homepageCatalog.fleet.mode, "RANDOM");
    assert.equal(catalog.homepageCatalog.fleet.selectedIds.length, 3);
  } finally {
    await prisma.$transaction(async (tx) => {
      await tx.catalogHomepageSettings.deleteMany({
        where: { kind: { in: ["packages", "fleet"] } },
      });
      for (const row of original)
        await tx.catalogHomepageSettings.create({ data: row });
      await tx.package.deleteMany({ where: { id: { startsWith: prefix } } });
      await tx.vehicle.deleteMany({
        where: { id: { in: vehicleIds.map(Number) } },
      });
      await tx.adminUser.deleteMany({ where: { username: prefix } });
    });
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
});
