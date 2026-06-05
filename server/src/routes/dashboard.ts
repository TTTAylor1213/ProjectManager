import { Router, Request, Response } from "express";
import { query, queryOne } from "../db/index.js";

const router = Router();

// GET /api/dashboard/summary — 顶部统计
router.get("/summary", (_req: Request, res: Response) => {
  try {
    const totalProjects = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM project"))?.c ?? 0;
    const activeProjects = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM project WHERE status = 'active'"))?.c ?? 0;
    const completedProjects = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM project WHERE status = 'completed'"))?.c ?? 0;
    const riskProjects = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM project WHERE risk_level = 'high'"))?.c ?? 0;

    const totalDevices = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM device"))?.c ?? 0;
    const shippedDevices = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM device WHERE ship_status = 'shipped'"))?.c ?? 0;
    const customerSiteDevices = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM device WHERE status = 'customer_site'"))?.c ?? 0;
    const repairingDevices = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM device WHERE repair_status = 'repairing'"))?.c ?? 0;

    const totalPersonnel = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM personnel"))?.c ?? 0;
    const totalRepairs = (queryOne<{ c: number }>("SELECT COUNT(*) as c FROM repair"))?.c ?? 0;

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        riskProjects,
        totalDevices,
        shippedDevices,
        customerSiteDevices,
        repairingDevices,
        totalPersonnel,
        totalRepairs,
      },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/dashboard/cards?status=xxx — 项目卡片聚合数据
router.get("/cards", (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let whereClause = "";
    const params: any[] = [];

    if (status && status !== "all") {
      whereClause = "WHERE project.status = ?";
      params.push(status as string);
    }

    const rows = query<any>(
      `SELECT
        project.*,
        p1.name as manager_name,
        p2.name as software_owner_name,
        p3.name as hardware_owner_name,
        p4.name as fpga_owner_name,
        p5.name as arm_owner_name,
        (SELECT COUNT(*) FROM device WHERE device.project_id = project.id) as device_count,
        (SELECT COUNT(*) FROM device WHERE device.project_id = project.id AND device.ship_status = 'shipped') as shipped_count,
        (SELECT COUNT(*) FROM device WHERE device.project_id = project.id AND device.status = 'customer_site') as customer_site_count,
        (SELECT COUNT(*) FROM device WHERE device.project_id = project.id AND device.repair_status = 'repairing') as repairing_count
      FROM project
      LEFT JOIN personnel p1 ON project.manager_id = p1.id
      LEFT JOIN personnel p2 ON project.software_owner_id = p2.id
      LEFT JOIN personnel p3 ON project.hardware_owner_id = p3.id
      LEFT JOIN personnel p4 ON project.fpga_owner_id = p4.id
      LEFT JOIN personnel p5 ON project.arm_owner_id = p5.id
      ${whereClause}
      ORDER BY
        CASE project.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
        project.id DESC`,
      params
    );

    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
