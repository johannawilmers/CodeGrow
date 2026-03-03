import { BrowserRouter, Routes, Route } from "react-router-dom";
import { auth } from "./firebase";

import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import Social from "./pages/Social";
import TaskPage from "./pages/TaskPage";
import Login from "./components/Login";
import TasksByTopicPage from "./pages/TaskByTopic";
import TopicEditor from "./pages/TopicEditor";
import { useState, useEffect } from "react";
import SurveyPopup from "./components/SurveyPopup";

import { validateStreak } from "./utils/validateStreak";
import AdminPage from "./pages/AdminPage";

function App() {
  const [showSurvey, setShowSurvey] = useState(false);

  const [currentUid, setCurrentUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUid(user.uid);
        validateStreak(user.uid);
        // show survey popup only first login per browser
        const done = localStorage.getItem("surveyDone");
        if (!done) {
          setShowSurvey(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <Login>
        <NavBar />
        {showSurvey && (
          <SurveyPopup
            userId={currentUid}
            onClose={() => {
              localStorage.setItem("surveyDone", "1");
              setShowSurvey(false);
            }}
          />
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:taskId" element={<TaskPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
          <Route path="/admin" element={<AdminPage />} />
          
          <Route
            path="/topic/:topicId/tasks"
            element={<TasksByTopicPage />}
          />
          <Route
            path="/topic/:topicId/edit"
            element={<TopicEditor />}
          />
        </Routes>
      </Login>
    </BrowserRouter>
  );
}

export default App;
