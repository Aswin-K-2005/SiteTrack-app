import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import EmployeeHome from "./EmployeeHome";

export default function Home() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "admin" ? <AdminDashboard /> : <EmployeeHome />;
}
