import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Sparkles,
  Check,
  Pencil,
  Globe,
  Users,
} from "lucide-react";
import { api, send, labels, statuses } from "../services/api";
import {
  Readiness,
  Facts,
  Suggestions,
  Badge,
  ErrorMessage,
  Loading,
} from "../components/Common";
export default function Workspace() {
  const { id } = useParams();
  const [c, setC] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [answers, setAnswers] = useState({}),
    [edit, setEdit] = useState(false),
    [draft, setDraft] = useState({}),
    [title, setTitle] = useState(""),
    [applications, setApplications] = useState([]),
    [notice, setNotice] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setC(null);
    setError("");
    Promise.all([
      api(`/challenges/${id}`),
      api(`/challenges/${id}/applications`),
    ])
      .then(([challenge, apps]) => {
        if (active) {
          setC(challenge);
          setApplications(apps);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  async function act(kind, fn) {
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  function startEdit() {
    setDraft(
      Object.fromEntries(Object.keys(labels).map((k) => [k, c[k] || ""])),
    );
    setTitle(c.title);
    setEdit(true);
  }
  async function saveAnswers(ai) {
    const clean = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v.trim()),
    );
    if (!Object.keys(clean).length) throw Error("Введите хотя бы один ответ.");
    const next = await send(
      `/challenges/${id}${ai ? "/clarify" : ""}`,
      ai ? { answers: clean } : { facts: clean },
      ai ? "POST" : "PATCH",
    );
    setC(next);
    setAnswers({});
    setNotice("Ответы сохранены. Готовность пересчитана.");
  }
  if (!c)
    return (
      <div className="page">
        <ErrorMessage error={error} />
        {error ? (
          <button
            className="button light"
            onClick={() => setAttempt(attempt + 1)}
          >
            Повторить
          </button>
        ) : (
          <Loading />
        )}
      </div>
    );
  const published = c.status === "PUBLISHED",
    selected = applications.some((a) => a.status === "SELECTED");
  return (
    <div className="page">
      <Link className="back-link" to="/business">
        <ArrowLeft size={16} /> Мои задачи
      </Link>
      <div className="page-heading">
        <div>
          <div className="heading-badges">
            <Badge tone="green">{statuses[c.status]}</Badge>
            {c.is_demo && <Badge>ДЕМОНСТРАЦИОННЫЕ ДАННЫЕ</Badge>}
          </div>
          <h1>{c.title}</h1>
          <p>
            {published
              ? "Задача в каталоге. Следующий шаг — выбрать команду."
              : "Уточните детали, проверьте бриф и откройте задачу для команд."}
          </p>
        </div>
      </div>
      <ErrorMessage error={error} />
      {notice && (
        <div className="notice success" role="status">
          <Check size={18} />
          {notice}
        </div>
      )}
      {busy && (
        <Loading
          text={
            busy === "clarify"
              ? "AI готовит следующие вопросы…"
              : "Сохраняем изменения…"
          }
        />
      )}
      <div className="workspace-grid">
        <div className="workspace-main">
          {!published && c.questions.length > 0 && !edit && (
            <section className="panel">
              <div className="section-title">
                <span className="icon-tile">
                  <Sparkles size={21} />
                </span>
                <div>
                  <h2>Давайте добавим ясности</h2>
                  <p>
                    Ответьте своими словами. Можно заполнить часть вопросов.
                  </p>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act("clarify", () => saveAnswers(true));
                }}
              >
                {c.questions.map((q) => (
                  <label className="field" key={q.field}>
                    <span>{q.question}</span>
                    <textarea
                      rows={3}
                      minLength={2}
                      maxLength={5000}
                      value={answers[q.field] || ""}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.field]: e.target.value })
                      }
                      placeholder="Ваш ответ…"
                    />
                  </label>
                ))}
                <div className="actions">
                  <button className="button dark" disabled={!!busy}>
                    <Sparkles size={16} /> Сохранить и уточнить с AI
                  </button>
                  <button
                    type="button"
                    className="button light"
                    disabled={!!busy}
                    onClick={() => act("save", () => saveAnswers(false))}
                  >
                    Сохранить без AI
                  </button>
                </div>
              </form>
            </section>
          )}
          <section className="panel">
            <div className="section-title spread">
              <div>
                <div className="eyebrow">ФАКТЫ, ПРЕДОСТАВЛЕННЫЕ БИЗНЕСОМ</div>
                <h2>Структурированный бриф</h2>
              </div>
              {!published && !edit && (
                <button
                  className="text-button"
                  onClick={startEdit}
                  disabled={!!busy}
                >
                  <Pencil size={15} /> Изменить
                </button>
              )}
            </div>
            {edit ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act("edit", async () => {
                    setC(
                      await send(
                        `/challenges/${id}`,
                        {
                          title,
                          facts: Object.fromEntries(
                            Object.entries(draft).map(([k, v]) => [
                              k,
                              v.trim() || null,
                            ]),
                          ),
                        },
                        "PATCH",
                      ),
                    );
                    setEdit(false);
                    setNotice("Бриф сохранён.");
                  });
                }}
              >
                <label className="field">
                  Название
                  <input
                    value={title}
                    required
                    minLength={2}
                    maxLength={250}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                {Object.entries(labels).map(([key, label]) => (
                  <label className="field" key={key}>
                    {label}
                    <textarea
                      rows={2}
                      minLength={2}
                      maxLength={5000}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                    />
                  </label>
                ))}
                <div className="actions">
                  <button className="button dark" disabled={!!busy}>
                    Сохранить бриф
                  </button>
                  <button
                    type="button"
                    className="button light"
                    disabled={!!busy}
                    onClick={() => setEdit(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <Facts challenge={c} />
            )}
            <details className="source">
              <summary>Исходное описание бизнеса</summary>
              <p>{c.raw_description}</p>
            </details>
          </section>
          <Suggestions challenge={c} />
          <section className="panel">
            <div className="section-title spread">
              <div>
                <div className="eyebrow">NVIDIA · НЕЗАВИСИМЫЙ ОТЗЫВ</div>
                <h2>Техническая проверка</h2>
              </div>
              <button
                className="button light"
                disabled={!!busy}
                onClick={() =>
                  act("review", async () => {
                    const review = await send(`/challenges/${id}/review`);
                    setC({ ...c, review });
                  })
                }
              >
                {c.review ? "Повторить" : "Проверить"}
              </button>
            </div>
            <p className="muted small">
              Рекомендательный отзыв о данных и реализуемости. Не влияет на
              готовность и не блокирует публикацию.
            </p>
            {c.review &&
              (c.review.status === "unavailable" ? (
                <p className="notice">
                  Техническая проверка недоступна. Продолжайте работу без неё.
                </p>
              ) : (
                <div className="review">
                  <p>{c.review.result.review_summary}</p>
                  <h3>Реализуемость</h3>
                  <p>{c.review.result.technical_feasibility}</p>
                  <h3>Готовность данных</h3>
                  <p>{c.review.result.data_readiness}</p>
                  <h3>Риски</h3>
                  <ul>
                    {c.review.result.risks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <h3>Что уточнить</h3>
                  <ul>
                    {c.review.result.technical_questions.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
          {published && (
            <section className="panel" id="applications">
              <div className="section-title">
                <Users size={24} />
                <h2>
                  Заявки команд{" "}
                  <span className="count">{applications.length}</span>
                </h2>
              </div>
              {applications.length === 0 ? (
                <div className="empty compact">
                  <p>
                    Пока нет заявок. Откройте карточку в каталоге и отправьте
                    первую заявку от команды.
                  </p>
                  <Link className="text-button" to={`/challenges/${id}`}>
                    Открыть карточку <ArrowUpRight size={16} />
                  </Link>
                </div>
              ) : (
                applications.map((a) => (
                  <article
                    className={`application ${a.status === "SELECTED" ? "selected" : ""}`}
                    key={a.id}
                  >
                    <div className="spread">
                      <h3>{a.team_name}</h3>
                      <Badge tone={a.status === "SELECTED" ? "green" : ""}>
                        {a.status === "SELECTED"
                          ? "Команда выбрана"
                          : a.status === "REJECTED"
                            ? "Не выбрана"
                            : "Новая заявка"}
                      </Badge>
                    </div>
                    <p className="small muted">
                      Участников: {a.members_count} ·{" "}
                      <a href={a.github_url} target="_blank" rel="noreferrer">
                        GitHub ↗
                      </a>
                    </p>
                    <div className="tags">
                      {a.skills.map((s, i) => (
                        <span key={i}>{s}</span>
                      ))}
                    </div>
                    <p>{a.motivation}</p>
                    {!selected && (
                      <button
                        className="button dark"
                        disabled={!!busy}
                        onClick={() =>
                          act("select", async () => {
                            await send(
                              `/applications/${a.id}/select`,
                              {},
                              "PATCH",
                            );
                            setApplications(
                              await api(`/challenges/${id}/applications`),
                            );
                            setNotice(`Команда «${a.team_name}» выбрана.`);
                          })
                        }
                      >
                        Выбрать команду <Check size={16} />
                      </button>
                    )}
                  </article>
                ))
              )}
            </section>
          )}
        </div>
        <div className="workspace-sidebar">
          <Readiness challenge={c} />
          <div className="publish-box">
            {published ? (
              <Link className="button dark full" to={`/challenges/${id}`}>
                Открыть в каталоге <ArrowUpRight size={17} />
              </Link>
            ) : (
              <>
                <button
                  className="button dark full"
                  disabled={!!busy || c.readiness_score < 100 || edit}
                  onClick={() =>
                    act("publish", async () => {
                      setC(await send(`/challenges/${id}/publish`));
                      setNotice("Задача опубликована в каталоге.");
                    })
                  }
                >
                  <Globe size={17} /> Опубликовать задачу
                </button>
                <p className="small muted">
                  Нужно заполнить все 8 критериев. После публикации бриф
                  фиксируется для команд.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
