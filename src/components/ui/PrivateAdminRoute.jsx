// components/PrivateAdminRoute.jsx
import { Navigate } from 'react-router-dom';

const PrivateAdminRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.role !== "admin") {
    return <Navigate to="/" />;
  }
  return children;
};

export default PrivateAdminRoute;
