import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import CreateCustomer from './pages/CreateCustomer';
import CreateOrder from './pages/CreateOrder';
import Orders from './pages/Orders';
import Appointments from './pages/Appointments';
import Inventory from './pages/Inventory';
import Services from './pages/Services';
import Revenue from './pages/Revenue';
import Settings from './pages/Settings';
import ShopSettings from './pages/settings/ShopSettings';
import Reminders from './pages/Reminders';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Pipeline from './pages/Pipeline';
import Templates from './pages/Templates';
import Login from './pages/Login';
import Profile from './pages/Profile';
import AdminPanel from './pages/admin/AdminPanel';
import Staff from './pages/Staff';
import { useAuthStore } from './store/authStore';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  if (isAuthenticated && user && typeof user.id === 'number') {
    // Force logout old mock session
    logout();
    return <Navigate to="/login" replace />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="templates" element={<Templates />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/create" element={<CreateCustomer />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
          <Route path="customers/:id/create-order" element={<CreateOrder />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="orders" element={<Orders />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="services" element={<Services />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="shop-settings" element={<ShopSettings />} />
          <Route path="staff" element={<Staff />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
