import { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext.jsx";

function Nav() {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isAuthenticated, logout } = useContext(AuthContext);
  const dropDownMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropDownMenuRef.current &&
        !dropDownMenuRef.current.contains(event.target)
      ) {
        setIsAccountOpen(false);
        setIsHelpOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav>
      <a href="/">SEWSS VINTAGE</a>
      <form>
        <input type="search" placeholder="Search products..." />
        <button type="submit">Search</button>
      </form>

      <div className="account-menu">
        <button
          type="button"
          onClick={() => {
            setIsAccountOpen(!isAccountOpen);
          }}
        >
          Account ▾
        </button>

        {isAccountOpen && (
          <div className="account-dropdown" ref={dropDownMenuRef}>
            {isAuthenticated ? (
              <>
                <Link to="/account">
                  <button onClick={() => setIsAccountOpen(false)}>
                    My Account
                  </button>
                </Link>

                <button>Orders</button>
                <button
                  onClick={() => {
                    setIsAccountOpen(false);
                    logout();
                  }}
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link to="/login">
                <button onClick={() => setIsAccountOpen(false)}>
                  Sign In / Sign Up
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="help-menu">
        <button
          type="button"
          onClick={() => {
            setIsHelpOpen(!isHelpOpen);
          }}
        >
          Help ▾
        </button>
        {isHelpOpen && (
          <div className="help-dropdown" ref={dropDownMenuRef}>
            <button>FAQ</button>
            <button>Contact Us</button>
          </div>
        )}
      </div>

      <a href="/cart">Cart</a>
    </nav>
  );
}

export default Nav;
