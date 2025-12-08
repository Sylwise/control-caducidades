import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import AuthContext from "../AuthContext";
import config from "../../config";

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      setIsAuthenticated(!!token);

      if (token) {
        // Obtener información del usuario
        const apiUrl = `${config.apiUrl}/auth/me`;
        fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) {
              setUser(data);
            }
          })
          .catch(console.error);
      }
    };

    checkAuth();
  }, []);

  const authContextValue = {
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    token: localStorage.getItem("token") || sessionStorage.getItem("token"),
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
