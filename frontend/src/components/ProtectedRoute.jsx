import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useContext(AuthContext);

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : null;
  const isAdminGate = allowedRoles?.includes("ADMIN");

  if (!user) {
    return <Navigate to={isAdminGate ? "/admin/login" : "/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "CONVENOR") return <Navigate to="/convenor" replace />;
    return <Navigate to="/student" replace />;
  }

  return children;
};

export default ProtectedRoute;
