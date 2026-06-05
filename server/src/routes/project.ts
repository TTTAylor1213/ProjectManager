import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT project.*,
  p1.name as manager_name,
  p2.name as software_owner_name,
  p3.name as hardware_owner_name,
  p4.name as fpga_owner_name,
  p5.name as arm_owner_name
FROM project
LEFT JOIN personnel p1 ON project.manager_id = p1.id
LEFT JOIN personnel p2 ON project.software_owner_id = p2.id
LEFT JOIN personnel p3 ON project.hardware_owner_id = p3.id
LEFT JOIN personnel p4 ON project.fpga_owner_id = p4.id
LEFT JOIN personnel p5 ON project.arm_owner_id = p5.id`;

// GET /api/projects — 列表（支持搜索、状态筛选）
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const { clause, params } = buildWhere(
      ["project.name", "project.code", "project.description"],
      search as string,
      { ...(status ? { "project.status": status as string } : {}) }
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY project.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/projects/:id
router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE project.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该项目" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/projects — 新增
router.post("/", (req: Request, res: Response) => {
  try {
    const {
      name, code, description, status, startDate, endDate, managerId,
      softwareOwnerId, hardwareOwnerId, fpgaOwnerId, armOwnerId,
      armStatus, fpgaStatus, pcStatus, hardwareStatus,
      targetDate, actualFinishDate, priority, riskLevel, remark,
    } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "项目名称不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO project (name, code, description, status, start_date, end_date, manager_id,
       software_owner_id, hardware_owner_id, fpga_owner_id, arm_owner_id,
       arm_status, fpga_status, pc_status, hardware_status,
       target_date, actual_finish_date, priority, risk_level, remark,
       created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?,
               ?, ?, ?, ?,
               ?, ?, ?, ?, ?,
               ?, ?)`,
      [
        name, code || "", description || "", status || "active",
        startDate || ts, endDate || null, managerId || null,
        softwareOwnerId || null, hardwareOwnerId || null, fpgaOwnerId || null, armOwnerId || null,
        armStatus || "not_started", fpgaStatus || "not_started", pcStatus || "not_started", hardwareStatus || "not_started",
        targetDate || "", actualFinishDate || null, priority || "normal", riskLevel || "low", remark || "",
        ts, ts,
      ]
    );
    const row = queryOne<any>(`${JOIN_SQL} WHERE project.id = ?`, [id]);
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
    if (!existing) return res.status(404).json({ success: false, error: "未找到该项目" });
    const {
      name, code, description, status, startDate, endDate, managerId,
      softwareOwnerId, hardwareOwnerId, fpgaOwnerId, armOwnerId,
      armStatus, fpgaStatus, pcStatus, hardwareStatus,
      targetDate, actualFinishDate, priority, riskLevel, remark,
    } = req.body;
    const ts = now();
    run(
      `UPDATE project SET
        name=?, code=?, description=?, status=?, start_date=?, end_date=?, manager_id=?,
        software_owner_id=?, hardware_owner_id=?, fpga_owner_id=?, arm_owner_id=?,
        arm_status=?, fpga_status=?, pc_status=?, hardware_status=?,
        target_date=?, actual_finish_date=?, priority=?, risk_level=?, remark=?,
        updated_at=?
       WHERE id=?`,
      [
        name ?? existing.name, code ?? existing.code, description ?? existing.description,
        status ?? existing.status, startDate ?? existing.start_date, endDate ?? existing.end_date,
        managerId ?? existing.manager_id,
        softwareOwnerId ?? existing.software_owner_id, hardwareOwnerId ?? existing.hardware_owner_id,
        fpgaOwnerId ?? existing.fpga_owner_id, armOwnerId ?? existing.arm_owner_id,
        armStatus ?? existing.arm_status, fpgaStatus ?? existing.fpga_status,
        pcStatus ?? existing.pc_status, hardwareStatus ?? existing.hardware_status,
        targetDate ?? existing.target_date, actualFinishDate ?? existing.actual_finish_date,
        priority ?? existing.priority, riskLevel ?? existing.risk_level, remark ?? existing.remark,
        ts, id,
      ]
    );
    const row = queryOne<any>(`${JOIN_SQL} WHERE project.id = ?`, [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM project WHERE id = ?", [id]))
      return res.status(404).json({ success: false, error: "未找到该项目" });
    run("DELETE FROM project WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
