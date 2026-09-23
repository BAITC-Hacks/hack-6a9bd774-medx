import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";
import { send } from "../services/api";
import { ErrorMessage, Loading } from "../components/Common";
const example = "Мы хотим использовать AI для анализа отзывов студентов.";
export default function Create() {
  const [text, setText] = useState(
      () => sessionStorage.getItem("sanabridge.input") || "",
    ),
    [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function create(kind) {
    setBusy(kind);
    setError("");
    try {
      const result =
        kind === "demo"
          ? await send("/demo")
          : kind === "manual"
            ? await send("/challenges", {
                title: "Новая бизнес-задача",
                raw_description: text,
                facts: {},
              })
            : await send("/challenges/analyze", { raw_description: text });
      sessionStorage.removeItem("sanabridge.input");
      navigate(`/business/${result.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="page create-page">
      <Link className="back-link" to="/business">
        <ArrowLeft size={16} /> Мои задачи
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ШАГ 01 · ОПИШИТЕ ИДЕЮ</div>
          <h1>Какую проблему вы хотите решить?</h1>
          <p>
            Не нужен идеальный бриф. Начните своими словами — мы поможем с
            остальным.
          </p>
        </div>
      </div>
      <div className="create-grid">
        <section className="panel input-panel">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create("ai");
            }}
          >
            <label htmlFor="description">Расскажите о бизнес-задаче</label>
            <textarea
              id="description"
              minLength={10}
              maxLength={12000}
              required
              rows={8}
              value={text}
              placeholder="Например: мы получаем сотни отзывов студентов и хотим понять, что нужно улучшить…"
              onChange={(e) => {
                setText(e.target.value);
                sessionStorage.setItem("sanabridge.input", e.target.value);
              }}
            />
            <div className="input-meta">
              <button
                type="button"
                className="text-button"
                disabled={!!busy}
                onClick={() => {
                  setText(example);
                  sessionStorage.setItem("sanabridge.input", example);
                }}
              >
                Попробовать пример
              </button>
              <span>{text.length}/12000</span>
            </div>
            <ErrorMessage error={error} />
            {busy && (
              <Loading
                text={
                  busy === "ai"
                    ? "AI выделяет факты и готовит вопросы…"
                    : "Сохраняем задачу…"
                }
              />
            )}
            <button
              className="button dark full"
              disabled={!!busy || text.trim().length < 10}
            >
              <Sparkles size={18} /> Проанализировать с AI{" "}
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="button plain full"
              disabled={!!busy || text.trim().length < 10}
              onClick={() => create("manual")}
            >
              Заполнить бриф вручную
            </button>
          </form>
        </section>
        <aside className="create-aside">
          <div className="eyebrow">ЧТО ПРОИЗОЙДЁТ ДАЛЬШЕ</div>
          <ol>
            <li>
              <b>Выделим главное</b>
              <span>Цель, данные, пользователи и ожидаемый результат.</span>
            </li>
            <li>
              <b>Уточним недостающее</b>
              <span>До трёх вопросов за раз, с учётом вашей задачи.</span>
            </li>
            <li>
              <b>Подготовим к публикации</b>
              <span>
                Прозрачный процент готовности и структурированная карточка.
              </span>
            </li>
          </ol>
          <div className="aside-note">
            <ShieldCheck size={22} />
            <p>
              Неизвестные факты останутся пустыми. AI-предложения будут отмечены
              отдельно.
            </p>
          </div>
          <div className="demo-box">
            <FlaskConical size={20} />
            <h3>Хотите увидеть весь путь?</h3>
            <p>
              Создайте готовую демо-задачу без обращения к AI. Все данные будут
              помечены как пример.
            </p>
            <button
              className="text-button"
              disabled={!!busy}
              onClick={() => create("demo")}
            >
              Загрузить демо <ArrowRight size={15} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
