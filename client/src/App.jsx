import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import PropTypes from "prop-types";
import ProductList from "./components/ProductList";
import Login from "./components/Login";
import MainLayout from "./components/MainLayout";
import TrainingDashboard from "./components/TrainingDashboard";
import EmployeeDetail from "./components/EmployeeDetail";
import AuthProvider from "./contexts/providers/AuthProvider";
import { SocketProvider } from "./contexts/providers/SocketProvider";
import { SyncProvider } from "./contexts/providers/SyncProvider";
import { DeletedProductsProvider } from "./contexts/DeletedProductsContext";
import { ToastProvider } from "./contexts/ToastContext";

const PrivateRoute = ({ children }) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <SocketProvider>
          <SyncProvider>
            <DeletedProductsProvider>
              <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <MainLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="/inventory" replace />} />
                  <Route path="inventory" element={<ProductList />} />
                  <Route path="training" element={<TrainingDashboard />} />
                  <Route path="training/:employeeId" element={<EmployeeDetail />} />
                </Route>
              </Routes>
              </Router>
            </DeletedProductsProvider>
          </SyncProvider>
        </SocketProvider>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
