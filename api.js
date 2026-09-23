const base = "/api";
function businessKey() {
  let key = localStorage.getItem("sanabridge.workspace");
  if (!key) {
    key = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem("sanabridge.workspace", key);
  }
  return key;
}
export async function api(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 95000);
  try {
    const response = await fetch(base + path, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "X-Business-Key": businessKey(),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = Array.isArray(data.detail)
        ? data.detail
            .map((e) => `${e.loc.slice(1).join(".")}: ${e.msg}`)
            .join("; ")
        : data.detail;
      throw new Error(
        message || "Не удалось выполнить запрос. Попробуйте ещё раз.",
      );
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "Запрос занял слишком много времени. Проверьте «Мои задачи» перед повторной отправкой.",
      );
    if (error instanceof TypeError)
      throw new Error(
        "Нет соединения с сервером. Проверьте, что backend запущен.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export const send = (path, data = {}, method = "POST") =>
  api(path, { method, body: JSON.stringify(data) });
export const labels = {
  problem: "Проблема",
  goal: "Цель бизнеса",
  target_users: "Пользователи",
  available_data: "Доступные данные",
  expected_result: "Ожидаемый результат",
  success_metrics: "Метрики успеха",
  constraints: "Ограничения",
  deadline: "Сроки",
};
export const statuses = {
  DRAFT: "Черновик",
  CLARIFYING: "Нужны уточнения",
  READY: "Готова к публикации",
  PUBLISHED: "Опубликована",
};
