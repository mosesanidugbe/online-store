import { Link, BrowserRouter, Routes, Route } from "react-router-dom";
import { useContext } from "react";
import "./App.css";

import Nav from "./components/Nav";
import Home from "./pages/Home";
import Account from "./pages/Account";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerDashboard from "./pages/OwnerDashboard";
import AuthContext from "./context/AuthContext.jsx";

function App() {
  const { user } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <div className="app-container">
        <header>
          <Link to="/" className="store-logo">Sewss Vintage</Link>
          <form>
            <input type="search" placeholder="Search products..." />
            <button type="submit">Search</button>
          </form>
          <Nav />
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/owner"
              element={
                <ProtectedRoute>
                  {user?.role === "OWNER" ? (
                    <OwnerDashboard />
                  ) : (
                    <p role="alert">Owner access required.</p>
                  )}
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
