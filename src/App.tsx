import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import MyPage from "./pages/MyPage";
import Social from "./pages/Social";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/theme/:id" element={<Topics />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/social" element={<Social />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
