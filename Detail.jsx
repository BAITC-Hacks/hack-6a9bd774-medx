import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Users } from "lucide-react";
import { api, send } from "../services/api";
import {
  Facts,
  Suggestions,
  Readiness,
  ErrorMessage,
  Loading,
  Badge,
} from "../components/Common";
export default function Detail() {
  const { id } = useParams();
  const [c, setC] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [form, setForm] = useState({
      team_name: "",
      members_count: 3,
      skills: "",
      github_url: "",
      motivation: "",
    }),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setC(null);
    setError("");
    setDone(false);
    api(`/challenges/${id}`)
      .then((v) => {
        if (active) setC(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);
  function field(key, value) {
    setForm({ ...form, [key]: value });
  }
  async function apply(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await send(`/challenges/${id}/applications`, {
        ...form,
        members_count: Number(form.members_count),
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
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
  return (
    <div className="page">
      <Link className="back-link" to="/catalog">
        <ArrowLeft size={16} /> Каталог задач
      </Link>
      <div className="page-heading">
        <div>
          <div className="heading-badges">
            <Badge tone="green">AI SANA CHALLENGE</Badge>
            {c.is_demo && <Badge>ДЕМО · ВЫМЫШЛЕННЫЙ КЕЙС</Badge>}
          </div>
          <h1>{c.title}</h1>
          <p>Изучите задачу и расскажите, почему ваша команда подходит.</p>
        </div>
        <a className="button dark" href="#apply">
          Подать заявку <ArrowUpRight size={18} />
        </a>
      </div>
      <div className="workspace-grid">
        <div className="workspace-main">
          <section className="panel">
            <div className="eyebrow">БРИФ ОТ БИЗНЕСА</div>
            <Facts challenge={c} />
          </section>
          <Suggestions challenge={c} />
          <section className="panel" id="apply">
            <div className="section-title">
              <Users size={25} />
              <h2>Заявка от команды</h2>
            </div>
            {done ? (
              <div className="empty compact" role="status">
                <CheckCircle2 size={42} />
                <h2>Ваша заявка отправлена!</h2>
                <p>
                  Бизнес увидит информацию о команде в своём рабочем
                  пространстве.
                </p>
                <Link className="button light" to="/catalog">
                  Вернуться в каталог
                </Link>
              </div>
            ) : (
              <form onSubmit={apply}>
                <div className="form-row">
                  <label className="field">
                    Название команды
                    <input
                      required
                      minLength={2}
                      maxLength={120}
                      value={form.team_name}
                      onChange={(e) => field("team_name", e.target.value)}
                      placeholder="Например, Qadam AI"
                    />
                  </label>
                  <label className="field">
                    Количество участников
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      value={form.members_count}
                      onChange={(e) => field("members_count", e.target.value)}
                    />
                  </label>
                </div>
                <label className="field">
                  Навыки через запятую
                  <input
                    required
                    maxLength={1000}
                    placeholder="Python, NLP, React"
                    value={form.skills}
                    onChange={(e) => field("skills", e.target.value)}
                  />
                </label>
                <label className="field">
                  GitHub команды или проекта
                  <input
                    type="url"
                    required
                    maxLength={300}
                    placeholder="https://github.com/your-team"
                    value={form.github_url}
                    onChange={(e) => field("github_url", e.target.value)}
                  />
                </label>
                <label className="field">
                  Почему ваша команда подходит?
                  <textarea
                    required
                    minLength={20}
                    maxLength={3000}
                    rows={4}
                    placeholder="Расскажите об опыте и вашем подходе к решению…"
                    value={form.motivation}
                    onChange={(e) => field("motivation", e.target.value)}
                  />
                </label>
                <ErrorMessage error={error} />
                {busy && <Loading text="Отправляем заявку…" />}
                <button className="button dark" disabled={busy}>
                  Отправить заявку <ArrowUpRight size={17} />
                </button>
                <p className="small muted">
                  Информация будет доступна владельцу задачи. Одна заявка на
                  GitHub-ссылку.
                </p>
              </form>
            )}
          </section>
        </div>
        <div className="workspace-sidebar">
          <Readiness challenge={c} />
          <div className="aside-note">
            <p>
              Оценка показывает полноту брифа. Обсудите доступ к данным и
              технические риски до начала работы.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
