import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import { LoginPage, RegisterPage, HomePage } from "./features/auth";
import { GraphList, GraphDetail, KnowledgeGraphPage } from "./features/courses";
import { NotesPage } from "./features/notes";

function App() {
  const location = useLocation();
  const isNotesPage = location.pathname === '/notes';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen">
      <div className={isNotesPage ? 'h-screen' : isAuthPage ? 'flex items-center justify-center min-h-screen p-4' : ''}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/graphs" element={<GraphList />} />
          <Route path="/graphs/:graphId" element={<GraphDetail />} />
          <Route path="/graphs/:graphId/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/notes" element={<NotesPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
