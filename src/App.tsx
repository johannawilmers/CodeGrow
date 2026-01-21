import React, { useState, useEffect, type JSX } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // Import Navigate for protected routes
import NavBar from "./components/Navbar";
import Home from "./pages/Home";
import Topics from "./pages/Topics";
import MyPage from "./pages/MyPage";
import Social from "./pages/Social";
import SignInScreen from "./components/SignInScreen"; 
import { auth } from "./firebase"; 
import type { User } from 'firebase/auth'; 
                                    


function App() {
  const [user, setUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser as User | null); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []); 

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (loading) {

      return <div>Loading authentication...</div>;
    }
    if (!user) {

      return <Navigate to="/login" replace />;
    }
    return children; 
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h2>Loading application...</h2>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* <NavBar user={user} onSignOut={handleSignOut} /> */}
      <NavBar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/theme/:id" element={<Topics />} />
        <Route path="/login" element={<SignInScreen />} />

        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social"
          element={
            <ProtectedRoute>
              <Social />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
