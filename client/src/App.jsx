import { Link } from "react-router-dom";
import "./App.css";

import Nav from "./components/Nav";
import Home from "./pages/Home";
import Account from "./pages/Account";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";\nimport OwnerDashboard from "./pages/OwnerDashboard";\nimport AuthContext from "./context/AuthContext.jsx";\nimport { useContext } from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header>
          <Link to="/">SEWSS VINTAGE</Link>
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
            <Route path="/login" element={<Login />} />\n            <Route\n              path="/owner"\n              element={\n                <ProtectedRoute>\n                  {user?.role === "OWNER" ? <OwnerDashboard /> : <p role="alert">Owner access required.</p>}\n                </ProtectedRoute>\n              }\n            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
