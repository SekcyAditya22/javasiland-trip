import { Router } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  getCatalogHomepageSettings,
  saveCatalogHomepageSettings,
} from "../data/catalogHomepage.js";

const router = Router();
router.use(requireAdmin);
const fail = (error, res, next) => {
  if (error.status)
    return res.status(error.status).json({ message: error.message });
  next(error);
};
router.get("/:kind", async (req, res, next) => {
  try {
    res.json(await getCatalogHomepageSettings(req.params.kind));
  } catch (error) {
    fail(error, res, next);
  }
});
router.put("/:kind", async (req, res, next) => {
  try {
    res.json(await saveCatalogHomepageSettings(req.params.kind, req.body));
  } catch (error) {
    fail(error, res, next);
  }
});
export default router;
