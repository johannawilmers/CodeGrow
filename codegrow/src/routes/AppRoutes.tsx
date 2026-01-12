import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import About from "../pages/About";
import NotFound from "../pages/NotFound";
import MyPage from "../pages/MyPage";
import Social from "../pages/Social";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/social" element={<Social />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
