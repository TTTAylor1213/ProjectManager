import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT device.*, project.name as project_name, personnel.name as responsible_name
  FROM device
  LEFT JOIN project ON device.project_id = project.id
  LEFT JOIN personnel ON device.responsible_id = personnel.id`;

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, status, projectId } = req.query;
    const { clause, params } = buildWhere(
      ["device.name", "device.model", "device.serial_number", "device.device_type", "device.location"],
      search as string,
      { ...(status ? { "device.status": status as string } : {}), ...(projectId ? { "device.project_id": projectId as string } : {}) }
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY device.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE device.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该设备" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { name, model, serialNumber, deviceType, status, location, projectId, responsibleId } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "设备名称不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO device (name, model, serial_number, device_type, status, location, project_id, responsible_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, model || "", serialNumber || "", deviceType || "", status || "normal", location || "", projectId || null, responsibleId || null, ts, ts]
    );
    const row = queryOne<any>(`${JOIN_SQL} WHERE device.id = ?`, [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM device WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, error: "未找到该设备" });
    const { name, model, serialNumber, deviceType, status, location, projectId, responsibleId } = req.body;
    const ts = now();
    run(`UPDATE device SET name=?, model=?, serial_number=?, device_type=?, status=?, location=?, project_id=?, responsible_id=?, updated_at=? WHERE id=?`,
      [name ?? existing.name, model ?? existing.model, serialNumber ?? existing.serial_number, deviceType ?? existing.device_type,
       status ?? existing.status, location ?? existing.location, projectId ?? existing.project_id, responsibleId ?? existing.responsible_id, ts, id]);
    const row = queryOne<any>(`${JOIN_SQL} WHERE device.id = ?`, [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM device WHERE id = ?", [id])) return res.status(404).json({ success: false, error: "未找到该设备" });
    run("DELETE FROM device WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
