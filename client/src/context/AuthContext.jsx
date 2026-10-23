import { createContext, useState, useCallback } from "react";

const AuthContext = createContext();

function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getStoredToken() {
  const storedToken = localStorage.getItem("token");

  if (!storedToken) {
    return null;
  }

  try {
    return storedToken;
  } catch {
    localStorage.removeItem("token");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getStoredToken() && getStoredUser()),
  );
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(getStoredToken);

  function login({ token, user: authenticatedUser }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    setIsAuthenticated(true);
    setUser(authenticatedUser);
    setToken(token);
  }

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  }, []);

  // function logout() {
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user");
  //   setIsAuthenticated(false);
  //   setUser(null);
  //   setToken(null);
  // }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
