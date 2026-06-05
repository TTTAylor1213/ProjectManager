import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
});

// 通用 CRUD 工具函数
export async function fetchList<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<{ data: T[]; total: number }> {
  const res = await api.get(endpoint, { params });
  return res.data;
}

export async function fetchOne<T>(endpoint: string, id: number): Promise<T> {
  const res = await api.get(`${endpoint}/${id}`);
  return res.data.data;
}

export async function createOne<T>(
  endpoint: string,
  body: Partial<T>
): Promise<T> {
  const res = await api.post(endpoint, body);
  return res.data.data;
}

export async function updateOne<T>(
  endpoint: string,
  id: number,
  body: Partial<T>
): Promise<T> {
  const res = await api.put(`${endpoint}/${id}`, body);
  return res.data.data;
}

export async function deleteOne(endpoint: string, id: number): Promise<void> {
  await api.delete(`${endpoint}/${id}`);
}

export async function exportExcel(endpoint: string, params?: Record<string, string>): Promise<Blob> {
  const res = await api.get(endpoint, { params, responseType: "blob" });
  return res.data;
}

export default api;
