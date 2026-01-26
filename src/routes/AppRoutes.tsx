import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import MyPage from "../pages/MyPage";
import Social from "../pages/Social";
import Topics from "../pages/Topics";
import TaskPage from "../pages/TaskPage";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
          <Route path="/theme/:id" element={<Topics />} />
          <Route path="/task" element={<TaskPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
