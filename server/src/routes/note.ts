import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT note.*, personnel.name as author_name
  FROM note
  LEFT JOIN personnel ON note.author_id = personnel.id`;

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, target_type, target_id } = req.query;
    const filters: Record<string, string> = {};
    if (target_type) filters["note.target_type"] = target_type as string;
    if (target_id) filters["note.target_id"] = target_id as string;
    const { clause, params } = buildWhere(
      ["note.content"],
      search as string,
      filters
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY note.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE note.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该备注" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { content, targetType, targetId, authorId } = req.body;
    if (!content) return res.status(400).json({ success: false, error: "内容不能为空" });
    if (!targetType || !targetId) return res.status(400).json({ success: false, error: "关联类型和ID不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO note (content, target_type, target_id, author_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [content, targetType, targetId, authorId || null, ts]
    );
    const row = queryOne<any>(`${JOIN_SQL} WHERE note.id = ?`, [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM note WHERE id = ?", [id])) return res.status(404).json({ success: false, error: "未找到该备注" });
    run("DELETE FROM note WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
