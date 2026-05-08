import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyOTP from "./components/VerifyOTP";
import ConvenorLayout from "./layouts/ConvenorLayout";
import AdminLayout from "./layouts/AdminLayout";
import Overview from "./pages/Convenor/Overview";
import Modules from "./pages/Convenor/Modules";
import ModuleDetails from "./pages/Convenor/ModuleDetails";
import GroupDetails from "./pages/Convenor/GroupDetails";
import Landing from "./pages/Landing";
import StudentDashboard from "./pages/Dashboards/StudentDashboard";
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminRegister from "./pages/Admin/AdminRegister";
import AdminOverview from "./pages/Admin/AdminOverview";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminRoles from "./pages/Admin/AdminRoles";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />

        <Route
          path="/convenor"
          element={
            <ProtectedRoute role="CONVENOR">
              <ConvenorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="modules" element={<Modules />} />
          <Route path="modules/:id" element={<ModuleDetails />} />
          <Route path="groups/:id" element={<GroupDetails />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="roles" element={<AdminRoles />} />
        </Route>

        <Route
          path="/student"
          element={
            <ProtectedRoute role="STUDENT">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
