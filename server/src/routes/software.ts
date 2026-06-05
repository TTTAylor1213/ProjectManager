import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT software.*, device.name as device_name, project.name as project_name, personnel.name as developer_name
  FROM software
  LEFT JOIN device ON software.device_id = device.id
  LEFT JOIN project ON software.project_id = project.id
  LEFT JOIN personnel ON software.developer_id = personnel.id`;

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const { clause, params } = buildWhere(
      ["software.name", "software.version", "software.note"],
      search as string,
      { ...(status ? { "software.status": status as string } : {}) }
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY software.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE software.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该软件记录" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { name, version, status, updateDate, note, developerId, deviceId, projectId } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "软件名称不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO software (name, version, status, update_date, note, developer_id, device_id, project_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, version || "", status || "developing", updateDate || ts, note || "", developerId || null, deviceId || null, projectId || null, ts, ts]
    );
    const row = queryOne<any>(`${JOIN_SQL} WHERE software.id = ?`, [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM software WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, error: "未找到该软件记录" });
    const { name, version, status, updateDate, note, developerId, deviceId, projectId } = req.body;
    const ts = now();
    run(`UPDATE software SET name=?, version=?, status=?, update_date=?, note=?, developer_id=?, device_id=?, project_id=?, updated_at=? WHERE id=?`,
      [name ?? existing.name, version ?? existing.version, status ?? existing.status, updateDate ?? existing.update_date,
       note ?? existing.note, developerId ?? existing.developer_id, deviceId ?? existing.device_id, projectId ?? existing.project_id, ts, id]);
    const row = queryOne<any>(`${JOIN_SQL} WHERE software.id = ?`, [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM software WHERE id = ?", [id])) return res.status(404).json({ success: false, error: "未找到该软件记录" });
    run("DELETE FROM software WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
