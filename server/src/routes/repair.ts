import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT repair.*, device.name as device_name, project.name as project_name, personnel.name as handler_name
  FROM repair
  LEFT JOIN device ON repair.device_id = device.id
  LEFT JOIN project ON repair.project_id = project.id
  LEFT JOIN personnel ON repair.handler_id = personnel.id`;

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, repair_status } = req.query;
    const { clause, params } = buildWhere(
      ["repair.fault_description", "repair.repair_provider"],
      search as string,
      { ...(repair_status ? { "repair.repair_status": repair_status as string } : {}) }
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY repair.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE repair.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该维修记录" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { faultDescription, faultType, repairStatus, sentDate, returnedDate, repairProvider, cost, result, handlerId, deviceId, projectId } = req.body;
    if (!faultDescription) return res.status(400).json({ success: false, error: "故障描述不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO repair (fault_description, fault_type, repair_status, sent_date, returned_date, repair_provider, cost, result, handler_id, device_id, project_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [faultDescription, faultType || "", repairStatus || "pending", sentDate || ts, returnedDate || null,
       repairProvider || "", cost || 0, result || "", handlerId || null, deviceId || null, projectId || null, ts, ts]
    );
    // 同步设备维修状态
    if (deviceId && repairStatus) {
      const activeRepairStatuses = ["pending", "diagnosing", "repairing", "waiting_parts"];
      const resolvedStatuses = ["fixed", "returned", "closed"];
      if (activeRepairStatuses.includes(repairStatus)) {
        run("UPDATE device SET repair_status='repairing', status='repairing' WHERE id=?", [deviceId]);
      } else if (resolvedStatuses.includes(repairStatus)) {
        run("UPDATE device SET repair_status='normal', status='normal' WHERE id=?", [deviceId]);
      }
    }
    const row = queryOne<any>(`${JOIN_SQL} WHERE repair.id = ?`, [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM repair WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, error: "未找到该维修记录" });
    const { faultDescription, faultType, repairStatus, sentDate, returnedDate, repairProvider, cost, result, handlerId, deviceId, projectId } = req.body;
    const ts = now();
    run(`UPDATE repair SET fault_description=?, fault_type=?, repair_status=?, sent_date=?, returned_date=?, repair_provider=?, cost=?, result=?, handler_id=?, device_id=?, project_id=?, updated_at=? WHERE id=?`,
      [faultDescription ?? existing.fault_description, faultType ?? existing.fault_type,
       repairStatus ?? existing.repair_status, sentDate ?? existing.sent_date,
       returnedDate ?? existing.returned_date, repairProvider ?? existing.repair_provider,
       cost ?? existing.cost, result ?? existing.result,
       handlerId ?? existing.handler_id, deviceId ?? existing.device_id, projectId ?? existing.project_id, ts, id]);
    // 同步设备维修状态
    const finalDeviceId = deviceId ?? existing.device_id;
    const finalRepairStatus = repairStatus ?? existing.repair_status;
    if (finalDeviceId && finalRepairStatus) {
      const activeRepairStatuses = ["pending", "diagnosing", "repairing", "waiting_parts"];
      const resolvedStatuses = ["fixed", "returned", "closed"];
      if (activeRepairStatuses.includes(finalRepairStatus)) {
        run("UPDATE device SET repair_status='repairing', status='repairing' WHERE id=?", [finalDeviceId]);
      } else if (resolvedStatuses.includes(finalRepairStatus)) {
        run("UPDATE device SET repair_status='normal', status='normal' WHERE id=?", [finalDeviceId]);
      }
    }
    const row = queryOne<any>(`${JOIN_SQL} WHERE repair.id = ?`, [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM repair WHERE id = ?", [id])) return res.status(404).json({ success: false, error: "未找到该维修记录" });
    run("DELETE FROM repair WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
