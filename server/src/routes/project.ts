import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

// GET /api/projects — 获取列表（带关联查询负责人姓名）
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const { clause, params } = buildWhere(
      ["project.name", "project.code", "project.description"],
      search as string,
      {
        ...(status ? { "project.status": status as string } : {}),
      }
    );

    const rows = query<any>(
      `SELECT project.*, personnel.name as manager_name
       FROM project
       LEFT JOIN personnel ON project.manager_id = personnel.id
       ${clause}
       ORDER BY project.id DESC`,
      params
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/projects/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(
      `SELECT project.*, personnel.name as manager_name
       FROM project
       LEFT JOIN personnel ON project.manager_id = personnel.id
       WHERE project.id = ?`,
      [Number(req.params.id)]
    );
    if (!row) {
      return res.status(404).json({ success: false, error: "未找到该项目" });
    }
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/projects — 新增
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, code, description, status, startDate, endDate, managerId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "项目名称不能为空" });
    }
    const ts = now();
    const id = insert(
      `INSERT INTO project (name, code, description, status, start_date, end_date, manager_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        code || "",
        description || "",
        status || "active",
        startDate || ts,
        endDate || null,
        managerId || null,
        ts,
        ts,
      ]
    );
    const row = queryOne<any>(
      `SELECT project.*, personnel.name as manager_name
       FROM project LEFT JOIN personnel ON project.manager_id = personnel.id
       WHERE project.id = ?`,
      [id]
    );
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /api/projects/:id — 更新
router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM project WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: "未找到该项目" });
    }
    const { name, code, description, status, startDate, endDate, managerId } = req.body;
    const ts = now();
    run(
      `UPDATE project SET name=?, code=?, description=?, status=?, start_date=?, end_date=?, manager_id=?, updated_at=?
       WHERE id=?`,
      [
        name ?? existing.name,
        code ?? existing.code,
        description ?? existing.description,
        status ?? existing.status,
        startDate ?? existing.start_date,
        endDate ?? existing.end_date,
        managerId ?? existing.manager_id,
        ts,
        id,
      ]
    );
    const row = queryOne<any>(
      `SELECT project.*, personnel.name as manager_name
       FROM project LEFT JOIN personnel ON project.manager_id = personnel.id
       WHERE project.id = ?`,
      [id]
    );
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM project WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: "未找到该项目" });
    }
    run("DELETE FROM project WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
