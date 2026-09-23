import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, FolderOpen } from "lucide-react";
import { api } from "../services/api";
import { ChallengeCard, ErrorMessage, Loading } from "../components/Common";
export default function Catalog({ business = false }) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api(`/challenges${business ? "?scope=mine" : ""}`)
      .then((v) => {
        if (active) setItems(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [business, attempt]);
  const filtered = items.filter((c) =>
    `${c.title} ${c.problem || ""} ${c.required_skills.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {business
              ? "РАБОЧЕЕ ПРОСТРАНСТВО БИЗНЕСА"
              : "РЕАЛЬНЫЕ ЗАДАЧИ · НОВЫЕ ВОЗМОЖНОСТИ"}
          </div>
          <h1>{business ? "Мои задачи" : "Найдите свой следующий проект."}</h1>
          <p>
            {business
              ? "От первого описания до выбранной команды — всё здесь."
              : "Понятный бриф, открытые критерии, реальные бизнес-проблемы."}
          </p>
        </div>
        {business && (
          <Link className="button dark" to="/create">
            Создать задачу <ArrowUpRight size={18} />
          </Link>
        )}
      </div>
      {business && (
        <p className="workspace-note">
          Доступ к вашим задачам сохраняется в этом браузере. Не очищайте данные
          сайта до завершения демо.
        </p>
      )}
      <div className="catalog-toolbar">
        <span>
          {items.length} {business ? "задач в работе" : "опубликованных задач"}
        </span>
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Поиск задач"
            placeholder="Поиск по теме или навыку"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <ErrorMessage error={error} />
      {error && (
        <button
          className="button light"
          onClick={() => setAttempt(attempt + 1)}
        >
          Повторить
        </button>
      )}
      {loading ? (
        <Loading />
      ) : (
        !error && (
          <>
            {filtered.length ? (
              <div className="cards-grid">
                {filtered.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} business={business} />
                ))}
              </div>
            ) : (
              <div className="empty">
                <FolderOpen size={36} />
                <h2>
                  {query
                    ? "Ничего не найдено"
                    : business
                      ? "Первый челлендж начинается с вас"
                      : "Скоро здесь появятся задачи"}
                </h2>
                <p>
                  {query
                    ? "Попробуйте другой запрос."
                    : "Создайте задачу или загрузите демонстрационный пример."}
                </p>
                {!query && (
                  <Link className="button dark" to="/create">
                    Создать задачу
                  </Link>
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
