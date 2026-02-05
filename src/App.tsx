import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { auth } from "./firebase";

import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import Social from "./pages/Social";
import TaskPage from "./pages/TaskPage";
import Login from "./components/Login";
import TasksByTopicPage from "./pages/TaskByTopic";

import { validateStreak } from "./utils/validateStreak";
import ThemeTopicManager from "./pages/ThemeTopicManager";

function App() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        validateStreak(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Login>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:taskId" element={<TaskPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
          
          <Route
            path="/topic/:topicId/tasks"
            element={<TasksByTopicPage />}
          />
          <Route path="/admin/themes-topics" element={<ThemeTopicManager />} />

        </Routes>
      </Login>
    </BrowserRouter>
  );
}

export default App;
