import { Router } from "express";
import {
  createArticle,
  listArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  unpublishArticle,
} from "../controllers/theory.controller";

const router = Router();

/** CRUD */
router.post("/", createArticle); // tạo mới
router.get("/", listArticles); // list ?page=&limit=&q=&tag=&status=&sort=
router.get("/:idOrSlug", getArticle); // xem 1 bài theo id hoặc slug
router.patch("/:idOrSlug", updateArticle); // cập nhật (PATCH)
router.delete("/:idOrSlug", deleteArticle); // xóa mềm mặc định, ?hard=true để xóa hẳn

/** Actions */
router.post("/:idOrSlug/publish", publishArticle);
router.post("/:idOrSlug/unpublish", unpublishArticle);

export default router;
