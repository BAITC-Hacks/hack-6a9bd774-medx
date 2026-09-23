import { test, expect } from "@playwright/test";

test("business publishes, separate student applies, owner selects; persists on reload", async ({
  page,
  browser,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Большие решения/ }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/home.png", fullPage: true });
  await page.getByRole("link", { name: "Я представляю бизнес" }).click();
  await page.getByRole("button", { name: "Загрузить демо" }).click();
  await expect(
    page.getByRole("heading", {
      name: "AI-анализ обратной связи студентов",
      exact: true,
    }),
  ).toBeVisible();
  const challengeId = page.url().split("/").at(-1);
  await page.getByRole("button", { name: "Проверить", exact: true }).click();
  await expect(
    page.getByText("Техническая проверка недоступна.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Опубликовать задачу" }).click();
  await expect(page.getByText("Задача опубликована в каталоге.")).toBeVisible();
  const studentContext = await browser.newContext();
  const student = await studentContext.newPage();
  await student.goto("http://127.0.0.1:5173/catalog");
  await student.locator(`a[href="/challenges/${challengeId}"]`).click();
  await student.getByLabel("Название команды").fill("Qadam AI");
  await student.getByLabel("Количество участников").fill("4");
  await student.getByLabel("Навыки через запятую").fill("Python, NLP, React");
  await student
    .getByLabel("GitHub команды или проекта")
    .fill(`https://github.com/qadam-demo-${challengeId}`);
  await student
    .getByLabel("Почему ваша команда подходит?")
    .fill(
      "Мы умеем анализировать тексты и создавать веб-приложения. Начнём с оценки качества данных и базовой модели.",
    );
  await student.getByRole("button", { name: "Отправить заявку" }).click();
  await expect(
    student.getByRole("heading", { name: "Ваша заявка отправлена!" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Qadam AI", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Выбрать команду" }).click();
  await expect(page.getByText("Команда «Qadam AI» выбрана.")).toBeVisible();
  await page.reload();
  await expect(page.locator(".application.selected")).toContainText("Qadam AI");
  await page.screenshot({ path: "../docs/workspace.png", fullPage: true });
  expect(errors).toEqual([]);
  await studentContext.close();
});

test("missing OpenAI key: keeps input, manual clarification increases actual readiness", async ({
  page,
}) => {
  await page.goto("/create");
  await page.getByRole("button", { name: "Попробовать пример" }).click();
  await page.getByRole("button", { name: "Проанализировать с AI" }).click();
  await expect(page.getByRole("alert")).toContainText("OpenAI не настроен");
  await expect(page.getByLabel("Расскажите о бизнес-задаче")).toHaveValue(
    "Мы хотим использовать AI для анализа отзывов студентов.",
  );
  await page.getByRole("button", { name: "Заполнить бриф вручную" }).click();
  await expect(page.locator(".score-row strong")).toHaveText("0%");
  await page.getByRole("button", { name: "Изменить", exact: true }).click();
  const facts = {
    Проблема: "Отзывы разбираются вручную",
    "Цель бизнеса": "Сократить время анализа",
    Пользователи: "Учебный отдел",
    "Доступные данные": "1000 обезличенных отзывов CSV",
    "Ожидаемый результат": "Дашборд для учебного отдела",
    "Метрики успеха": "F1 не ниже 0.8 на 300 примерах",
    Ограничения: "Не передавать личные данные",
    Сроки: "30 ноября 2026",
  };
  for (const [label, value] of Object.entries(facts))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByRole("button", { name: "Сохранить бриф", exact: true })
    .click();
  await expect(page.locator(".score-row strong")).toHaveText("100%");
  await expect(page.getByLabel("История готовности")).toHaveText("0% → 100%");
  await expect(
    page.getByRole("button", { name: "Опубликовать задачу" }),
  ).toBeEnabled();
});

test("mobile home and forms fit viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/create", "/catalog"]) {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/");
  await page.screenshot({ path: "../docs/mobile.png", fullPage: true });
});
