// 获取当前时间字符串 (ISO 格式)
export function now(): string {
  return new Date().toISOString();
}

// 构建 WHERE 条件，用于搜索和筛选
export function buildWhere(
  searchFields: string[],
  search: string,
  filters: Record<string, string> = {}
): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  // 全局搜索
  if (search && searchFields.length > 0) {
    const searchConditions = searchFields.map((field) => {
      params.push(`%${search}%`);
      return `${field} LIKE ?`;
    });
    conditions.push(`(${searchConditions.join(" OR ")})`);
  }

  // 精确筛选
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
