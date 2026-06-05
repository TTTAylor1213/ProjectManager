import { Router, Request, Response } from "express";
import ExcelJS from "exceljs";
import { query } from "../db/index.js";

const router = Router();

// GET /api/export/:table — 导出指定表数据为 Excel
router.get("/:table", async (req: Request, res: Response) => {
  try {
    const table = req.params.table as string;
    const allowedTables = ["personnel", "project", "device", "shipment", "repair", "rd_device", "software", "hardware", "note"];

    if (!allowedTables.includes(table)) {
      return res.status(400).json({ success: false, error: "无效的表名" });
    }

    const rows = query<any>(`SELECT * FROM ${table} ORDER BY id DESC`);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "没有数据可导出" });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(table);

    // 表头
    const columns = Object.keys(rows[0]);
    sheet.columns = columns.map((col) => ({ header: col, key: col, width: 20 }));

    // 数据
    sheet.addRows(rows);

    // 设置表头样式
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${table}_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
