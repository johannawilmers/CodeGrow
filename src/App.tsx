import { BrowserRouter, Routes, Route } from "react-router-dom";
import { auth } from "./firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "./firebase";

import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import MyPage from "./pages/MyPage";
import Social from "./pages/Forum";
import TaskPage from "./pages/TaskPage";
import Login from "./components/Login";
import TasksByTopicPage from "./pages/TaskByTopic";
import TopicEditor from "./pages/TopicEditor";
import { useState, useEffect } from "react";
import SurveyPopup from "./components/SurveyPopup";

import { validateStreak } from "./utils/validateStreak";
import PostPage from "./pages/PostPage";

function App() {
  const [showSurvey, setShowSurvey] = useState(false);

  const [currentUid, setCurrentUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUid(user.uid);
        validateStreak(user.uid);
        // check both localStorage and DB for survey completion
        const localKey = `surveyDone_${user.uid}`;
        const localDone = localStorage.getItem(localKey);
        let dbDone = false;
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            dbDone = userDoc.data().surveyDone === true;
          }
        } catch (err) {
          console.error("Error checking survey status:", err);
        }
        if (!localDone && !dbDone) {
          setShowSurvey(true);
        }
      } else {
        // reset when no user is signed in
        setCurrentUid(null);
        setShowSurvey(false);
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
            onClose={async () => {
              if (currentUid) {
                localStorage.setItem(`surveyDone_${currentUid}`, "1");
                try {
                  await setDoc(
                    doc(db, "users", currentUid),
                    { surveyDone: true, surveyDoneAt: serverTimestamp() },
                    { merge: true }
                  );
                  console.log("Survey completion saved to DB for user:", currentUid);
                } catch (error) {
                  console.error("Error saving survey completion:", error);
                }
              }
              setShowSurvey(false);
            }}
          />
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:taskId" element={<TaskPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
          
          <Route
            path="/topic/:topicId/tasks"
            element={<TasksByTopicPage />}
          />
          <Route
            path="/topic/:topicId/edit"
            element={<TopicEditor />}
          />
          <Route path="/social/:postId" element={<PostPage />} />
        </Routes>
      </Login>
    </BrowserRouter>
  );
}

export default App;
