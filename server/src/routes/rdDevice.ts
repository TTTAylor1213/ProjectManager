import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT rd_device.*, project.name as project_name, personnel.name as responsible_name
  FROM rd_device
  LEFT JOIN project ON rd_device.project_id = project.id
  LEFT JOIN personnel ON rd_device.responsible_id = personnel.id`;

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, research_phase } = req.query;
    const { clause, params } = buildWhere(
      ["rd_device.name", "rd_device.model", "rd_device.current_status", "rd_device.specs"],
      search as string,
      { ...(research_phase ? { "rd_device.research_phase": research_phase as string } : {}) }
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY rd_device.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE rd_device.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该在研设备" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { name, model, researchPhase, currentStatus, targetDate, specs, responsibleId, projectId } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "设备名称不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO rd_device (name, model, research_phase, current_status, target_date, specs, responsible_id, project_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, model || "", researchPhase || "requirement", currentStatus || "", targetDate || "", specs || "", responsibleId || null, projectId || null, ts, ts]
    );
    const row = queryOne<any>(`${JOIN_SQL} WHERE rd_device.id = ?`, [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM rd_device WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, error: "未找到该在研设备" });
    const { name, model, researchPhase, currentStatus, targetDate, specs, responsibleId, projectId } = req.body;
    const ts = now();
    run(`UPDATE rd_device SET name=?, model=?, research_phase=?, current_status=?, target_date=?, specs=?, responsible_id=?, project_id=?, updated_at=? WHERE id=?`,
      [name ?? existing.name, model ?? existing.model, researchPhase ?? existing.research_phase,
       currentStatus ?? existing.current_status, targetDate ?? existing.target_date, specs ?? existing.specs,
       responsibleId ?? existing.responsible_id, projectId ?? existing.project_id, ts, id]);
    const row = queryOne<any>(`${JOIN_SQL} WHERE rd_device.id = ?`, [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM rd_device WHERE id = ?", [id])) return res.status(404).json({ success: false, error: "未找到该在研设备" });
    run("DELETE FROM rd_device WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
