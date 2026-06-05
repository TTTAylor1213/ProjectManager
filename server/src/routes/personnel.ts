import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

// GET /api/personnel — 获取列表（支持搜索）
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, department, role } = req.query;
    const { clause, params } = buildWhere(
      ["name", "department", "phone", "email", "role"],
      search as string,
      {
        ...(department ? { department: department as string } : {}),
        ...(role ? { role: role as string } : {}),
      }
    );

    const rows = query<any>(
      `SELECT * FROM personnel ${clause} ORDER BY id DESC`,
      params
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/personnel/:id — 获取详情
router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>("SELECT * FROM personnel WHERE id = ?", [
      Number(req.params.id),
    ]);
    if (!row) {
      return res.status(404).json({ success: false, error: "未找到该负责人" });
    }
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/personnel — 新增
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, department, phone, email, role, remark } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "姓名不能为空" });
    }
    const ts = now();
    const id = insert(
      `INSERT INTO personnel (name, department, phone, email, role, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, department || "", phone || "", email || "", role || "", remark || "", ts, ts]
    );
    const row = queryOne("SELECT * FROM personnel WHERE id = ?", [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /api/personnel/:id — 更新
router.put("/:id", (req: Request, res: Response) => {
  try {
    const { name, department, phone, email, role, remark } = req.body;
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM personnel WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: "未找到该负责人" });
    }
    const ts = now();
    run(
      `UPDATE personnel SET name=?, department=?, phone=?, email=?, role=?, remark=?, updated_at=? WHERE id=?`,
      [
        name ?? existing.name,
        department ?? existing.department,
        phone ?? existing.phone,
        email ?? existing.email,
        role ?? existing.role,
        remark ?? existing.remark,
        ts,
        id,
      ]
    );
    const row = queryOne("SELECT * FROM personnel WHERE id = ?", [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/personnel/:id — 删除
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM personnel WHERE id = ?", [id]);
    if (!existing) {
      return res.status(404).json({ success: false, error: "未找到该负责人" });
    }
    run("DELETE FROM personnel WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
