import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { addAuthChangeListener, getStoredUser } from "../../services/Auth/authStorage";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    return addAuthChangeListener(() => {
      setUser(getStoredUser());
    });
  }, []);

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
          message: "Please log in to continue."
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
