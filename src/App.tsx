import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import Topics from "./pages/Topics";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/theme/:id" element={<Topics />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
