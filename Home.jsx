import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Check,
  MessageSquareText,
  FileCheck2,
  Users,
  MoveUpRight,
} from "lucide-react";
export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <i className="dot" /> ОТ ИДЕИ — К РЕАЛЬНОМУ ПРОЕКТУ
          </div>
          <h1>
            Большие решения
            <br />
            начинаются с<br />
            <em>ясной задачи.</em>
          </h1>
          <p>
            Превратите бизнес-проблему в понятный AI-челлендж.
            <br className="desktop" /> Найдите студенческую команду, которая
            воплотит его в жизнь.
          </p>
          <div className="hero-actions">
            <Link className="button dark" to="/create">
              Я представляю бизнес <ArrowUpRight size={18} />
            </Link>
            <Link className="button light" to="/catalog">
              Я в студенческой команде <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-mark">
              <Sparkles size={15} />
            </span>
            AI помогает уточнить. Вы принимаете решения.
          </div>
        </div>
        <div
          className="hero-visual"
          aria-label="Пример преобразования идеи в задачу"
        >
          <div className="visual-grid" />
          <div className="visual-label">THE BRIDGE FROM WHY TO HOW</div>
          <div className="idea-note">
            <span className="note-icon">
              <MessageSquareText size={20} />
            </span>
            <div>
              <div className="eyebrow">ВАША ИДЕЯ</div>
              <p>
                «Хотим использовать AI
                <br />
                для анализа отзывов студентов»
              </p>
            </div>
          </div>
          <div className="bridge-path">
            <span />
            <Sparkles size={21} />
            <span />
          </div>
          <div className="preview-card">
            <div className="card-top">
              <BadgeExample />
              <span className="tiny">ПРИМЕР</span>
            </div>
            <h3>
              От обратной связи —<br />к улучшению обучения
            </h3>
            <div className="example-steps">
              <p>
                <Check size={16} /> Понятная цель и пользователи
              </p>
              <p>
                <Check size={16} /> Данные и измеримый результат
              </p>
              <p>
                <Check size={16} /> План для студенческой команды
              </p>
            </div>
            <div className="preview-footer">
              <span>Структурированный челлендж</span>
              <ArrowUpRight size={19} />
            </div>
          </div>
          <span className="visual-spark">✳</span>
        </div>
      </section>
      <section className="process">
        <div className="section-intro">
          <div>
            <div className="eyebrow">
              МЕНЬШЕ НЕОПРЕДЕЛЁННОСТИ. БОЛЬШЕ ДЕЙСТВИЙ.
            </div>
            <h2>Одна идея. Три шага к команде.</h2>
          </div>
          <Link to="/create">
            Начать сейчас <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="process-grid">
          {[
            {
              n: "01",
              icon: MessageSquareText,
              title: "Расскажите о проблеме",
              text: "Начните с нескольких предложений. AI выделит факты и задаст уточняющие вопросы.",
            },
            {
              n: "02",
              icon: FileCheck2,
              title: "Соберите ясный бриф",
              text: "Заполните пробелы и проверьте готовность. Каждый процент связан с конкретным критерием.",
            },
            {
              n: "03",
              icon: Users,
              title: "Найдите свою команду",
              text: "Опубликуйте задачу, получите заявки и выберите студентов с подходящими навыками.",
            },
          ].map(({ n, icon: Icon, title, text }) => (
            <article key={n}>
              <div className="step-head">
                <Icon size={24} />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="home-banner">
        <div>
          <div className="eyebrow">ДЛЯ ТЕХ, КТО ГОТОВ СОЗДАВАТЬ</div>
          <h2>
            Ваши навыки нужны
            <br />
            реальному бизнесу.
          </h2>
          <p>Выберите задачу и предложите решение от своей команды.</p>
        </div>
        <Link to="/catalog" className="button cream">
          Открыть каталог <MoveUpRight size={18} />
        </Link>
      </section>
    </div>
  );
}
function BadgeExample() {
  return <span className="badge green">AI SANA CHALLENGE</span>;
}
