import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import MyPage from "./pages/MyPage";
import Social from "./pages/Social";
import TaskPage from "./pages/TaskPage";
import Login from "./components/Login";

function App() {
  return (
    <BrowserRouter>
      <Login>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/theme/:id" element={<Topics />} />
          <Route path="/task" element={<TaskPage userId={""} taskId={""} />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
        </Routes>
      </Login>
    </BrowserRouter>
  );
}

export default App;
