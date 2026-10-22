import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import API_URL from "../api.js";
import { useNavigate } from "react-router-dom";

function Account() {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);
  useEffect(() => {
    async function getAccount() {
      try {
        const response = await fetch(`${API_URL}/account`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            logout();
            navigate("/login");
            return;
          }
          const data = await response.json();
          setError(data.message || "Failed to fetch account details");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setAccount(data.accountDetails);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error("Error fetching account details:", error);
        setError("An error occurred while fetching account details");
        setLoading(false);
      }
    }

    getAccount();
  }, [token, logout, navigate]);
  return (
    <div>
      {loading && <p>Loading account details...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {account && (
        <div>
          <h1>Account</h1>
          <p>Username: {account.username}</p>
          <p>Email: {account.email}</p>
          <p>Role: {account.role}</p>
        </div>
      )}
    </div>
  );
}

export default Account;
