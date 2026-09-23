import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Layers3 } from "lucide-react";
import { useEffect } from "react";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Create from "./pages/Create";
import Workspace from "./pages/Workspace";
import Detail from "./pages/Detail";
export default function App() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Layers3 size={24} />
          </span>
          SanaBridge
          <span className="brand-divider" />
          <span className="brand-program">AI SANA</span>
        </Link>
        <nav aria-label="Навигация">
          <NavLink to="/catalog">Каталог задач</NavLink>
          <NavLink to="/business">Мои задачи</NavLink>
        </nav>
        <Link to="/create" className="button dark header-cta">
          Создать задачу <ArrowUpRight size={16} />
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/business" element={<Catalog business />} />
          <Route path="/create" element={<Create />} />
          <Route path="/business/:id" element={<Workspace />} />
          <Route path="/challenges/:id" element={<Detail />} />
          <Route
            path="*"
            element={
              <div className="page empty">
                <h1>Страница не найдена</h1>
                <Link to="/">На главную</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <footer>
        <Link className="brand" to="/">
          SanaBridge
          <span className="dot" />
        </Link>
        <span>Бизнес-задачи. Студенческие команды. Реальные решения.</span>
        <span>HACKALEM · AI SANA</span>
      </footer>
    </>
  );
}
