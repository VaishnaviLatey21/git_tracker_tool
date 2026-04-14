import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import VerifyOTP from "./components/VerifyOTP";
import ConvenorLayout from "./layouts/ConvenorLayout";
import Overview from "./pages/Convenor/Overview";
import Modules from "./pages/Convenor/Modules";
import ModuleDetails from "./pages/Convenor/ModuleDetails";
import GroupDetails from "./pages/Convenor/GroupDetails";
import Landing from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
