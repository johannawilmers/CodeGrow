import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import MyPage from "../pages/MyPage";
import Social from "../pages/Social";
import TaskPage from "../pages/TaskPage";
import AdminPage from "../pages/AdminPage";
import TasksByTopicPage from "../pages/TaskByTopic";
import ThemeTopicManager from "../pages/ThemeTopicManager";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
          <Route path="/task" element={<TaskPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/topic/:topicId/tasks" element={<TasksByTopicPage />} />
          <Route path="/admin/themes-topics" element={<ThemeTopicManager />} />

        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
