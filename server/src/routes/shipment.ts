import { Router, Request, Response } from "express";
import { query, queryOne, insert, run } from "../db/index.js";
import { now, buildWhere } from "../utils.js";

const router = Router();

const JOIN_SQL = `SELECT shipment.*, device.name as device_name, project.name as project_name
  FROM shipment
  LEFT JOIN device ON shipment.device_id = device.id
  LEFT JOIN project ON shipment.project_id = project.id`;

router.get("/", (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const { clause, params } = buildWhere(
      ["shipment.recipient", "shipment.address", "shipment.tracking_number"],
      search as string,
      { ...(status ? { "shipment.status": status as string } : {}) }
    );
    const rows = query<any>(`${JOIN_SQL} ${clause} ORDER BY shipment.id DESC`, params);
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const row = queryOne<any>(`${JOIN_SQL} WHERE shipment.id = ?`, [Number(req.params.id)]);
    if (!row) return res.status(404).json({ success: false, error: "未找到该发货记录" });
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const { recipient, recipientPhone, address, trackingNumber, shipDate, status, note, deviceId, projectId } = req.body;
    if (!recipient) return res.status(400).json({ success: false, error: "收货人不能为空" });
    const ts = now();
    const id = insert(
      `INSERT INTO shipment (recipient, recipient_phone, address, tracking_number, ship_date, status, note, device_id, project_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [recipient, recipientPhone || "", address || "", trackingNumber || "", shipDate || ts, status || "in_transit", note || "", deviceId || null, projectId || null, ts, ts]
    );
    // 同步设备发货状态
    if (deviceId) {
      if (status === "delivered" || status === "shipped") {
        run("UPDATE device SET ship_status='shipped', status='customer_site', ship_date=? WHERE id=?", [shipDate || ts, deviceId]);
      } else if (status === "returned") {
        run("UPDATE device SET ship_status='returned' WHERE id=?", [deviceId]);
      }
    }
    const row = queryOne<any>(`${JOIN_SQL} WHERE shipment.id = ?`, [id]);
    res.status(201).json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = queryOne("SELECT * FROM shipment WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ success: false, error: "未找到该发货记录" });
    const { recipient, recipientPhone, address, trackingNumber, shipDate, status, note, deviceId, projectId } = req.body;
    const ts = now();
    run(`UPDATE shipment SET recipient=?, recipient_phone=?, address=?, tracking_number=?, ship_date=?, status=?, note=?, device_id=?, project_id=?, updated_at=? WHERE id=?`,
      [recipient ?? existing.recipient, recipientPhone ?? existing.recipient_phone, address ?? existing.address,
       trackingNumber ?? existing.tracking_number, shipDate ?? existing.ship_date, status ?? existing.status,
       note ?? existing.note, deviceId ?? existing.device_id, projectId ?? existing.project_id, ts, id]);
    // 同步设备状态
    const finalDeviceId = deviceId ?? existing.device_id;
    const finalStatus = status ?? existing.status;
    const finalShipDate = shipDate ?? existing.ship_date;
    if (finalDeviceId) {
      if (finalStatus === "delivered" || finalStatus === "shipped") {
        run("UPDATE device SET ship_status='shipped', status='customer_site', ship_date=? WHERE id=?", [finalShipDate || ts, finalDeviceId]);
      } else if (finalStatus === "returned") {
        run("UPDATE device SET ship_status='returned' WHERE id=?", [finalDeviceId]);
      }
    }
    const row = queryOne<any>(`${JOIN_SQL} WHERE shipment.id = ?`, [id]);
    res.json({ success: true, data: row });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!queryOne("SELECT * FROM shipment WHERE id = ?", [id])) return res.status(404).json({ success: false, error: "未找到该发货记录" });
    run("DELETE FROM shipment WHERE id = ?", [id]);
    res.json({ success: true, message: "删除成功" });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
