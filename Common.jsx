import {
  LoaderCircle,
  AlertCircle,
  ArrowUpRight,
  Check,
  Circle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { labels, statuses } from "../services/api";
export function ErrorMessage({ error }) {
  return error ? (
    <div className="notice error" role="alert">
      <AlertCircle size={19} />
      <span>{error}</span>
    </div>
  ) : null;
}
export function Loading({ text = "Загружаем…" }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={23} />
      {text}
    </div>
  );
}
export function Badge({ children, tone = "" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
export function Readiness({ challenge }) {
  const r = challenge.readiness;
  return (
    <aside className="panel readiness">
      <div className="eyebrow">CHALLENGE READINESS</div>
      <div className="score-row">
        <strong>
          {r.total_score}
          <span>%</span>
        </strong>
        <div className="score-orbit" style={{ "--score": `${r.total_score}%` }}>
          <Check size={25} />
        </div>
      </div>
      <div className="progress">
        <span style={{ width: `${r.total_score}%` }} />
      </div>
      <p className="muted small">
        {r.missing_criteria.length
          ? `Осталось уточнить: ${r.missing_criteria.length} из 8 критериев`
          : "Все критерии заполнены. Можно публиковать."}
      </p>
      <div className="criteria">
        {Object.entries(r.criterion_weights).map(([key, weight]) => (
          <div
            key={key}
            className={r.completed_criteria.includes(key) ? "complete" : ""}
          >
            {r.completed_criteria.includes(key) ? (
              <Check size={16} />
            ) : (
              <Circle size={15} />
            )}
            <span>{labels[key]}</span>
            <b>{weight}</b>
          </div>
        ))}
      </div>
      {challenge.score_history.length > 1 && (
        <div className="history" aria-label="История готовности">
          {challenge.score_history.map((score, i) => (
            <span key={i}>
              {i > 0 ? " → " : ""}
              {score}%
            </span>
          ))}
        </div>
      )}
      <p className="small muted">
        Считается по заполненным полям. Это полнота брифа, а не оценка качества
        или реализуемости.
      </p>
    </aside>
  );
}
export function ChallengeCard({ challenge, business = false }) {
  return (
    <Link
      className="challenge-card"
      to={
        business ? `/business/${challenge.id}` : `/challenges/${challenge.id}`
      }
    >
      <div className="card-top">
        <Badge tone={challenge.status === "PUBLISHED" ? "green" : ""}>
          {business ? statuses[challenge.status] : "AI CHALLENGE"}
        </Badge>
        {challenge.is_demo && <Badge>ДЕМО</Badge>}
        <ArrowUpRight size={20} />
      </div>
      <h3>{challenge.title}</h3>
      <p className="card-summary">
        {challenge.problem || challenge.raw_description}
      </p>
      <div className="tags">
        {challenge.required_skills.slice(0, 4).map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
      <div className="card-bottom">
        <span>
          <i className="dot" />
          {challenge.readiness_score}% готовности
        </span>
        <span>{challenge.deadline || "Срок уточняется"}</span>
      </div>
    </Link>
  );
}
export function Facts({ challenge }) {
  return (
    <div className="facts">
      {Object.entries(labels).map(([key, label]) => (
        <section key={key}>
          <h3>{label}</h3>
          <p className={!challenge[key] ? "muted" : ""}>
            {challenge[key] || "Пока не указано"}
          </p>
        </section>
      ))}
    </div>
  );
}
export function Suggestions({ challenge }) {
  if (!challenge.required_skills.length && !challenge.suggested_solution)
    return null;
  return (
    <section className="suggestions">
      <div className="eyebrow">AI-ПРЕДЛОЖЕНИЯ · НЕ ТРЕБОВАНИЯ БИЗНЕСА</div>
      <h3>Возможное направление решения</h3>
      <p>{challenge.suggested_solution || "Направление пока не предложено."}</p>
      <div className="tags">
        {challenge.required_skills.map((s, i) => (
          <span key={i}>{s}</span>
        ))}
      </div>
    </section>
  );
}
