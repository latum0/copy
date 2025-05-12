// App.jsx
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Product from "./pages/Product";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import About from "./pages/About";
import AccountPage from "./pages/AccountPage";
import Cart from "./pages/Cart";
import ProductListingPage from "./pages/ProductListingPage";
import Header from "./components/ui/Header";
import Footer from "./components/ui/Footer";
import PrivateAdminRoute from "./components/ui/PrivateAdminRoute";
import Checkout from "./pages/Checkout";

// Admin Components
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/Dashboard";
import ProductsAdmin from "./admin/pages/Products";
import OrdersAdmin from "./admin/pages/Orders";
import ClientsAdmin from "./admin/pages/Clients";
import PaymentsAdmin from "./admin/pages/Payments";
import TransactionsAdmin from "./admin/pages/Transactions";

// Seller Components
import DashboardSeller from "./pages/seller/DashboardSeller";
import ProductManagement from "./pages/seller/EditProduct";
import InventoryManagement from "./pages/seller/Inventory";
import OrderManagement from "./pages/seller/Orders";
import Analytics from "./pages/seller/Analytics";
import ProfileManagement from "./pages/seller/AdminProfile";
import SellerProducts from "./pages/seller/SellerProducts";
import AddProduct from "./pages/seller/AddProduct";

import "./App.css";

function LayoutWrapper() {
  const location = useLocation();

  const adminPaths = [
    "/dashboard",
    "/produits",
    "/commandes",
    "/clients",
    "/paiements",
    "/transactions"
  ];

  // Seller pages include any path starting with "/DashboardSeller"
  const sellerPaths = ["/DashboardSeller"];
  
  const hideHeaderFooter =
    adminPaths.some((path) => location.pathname.startsWith(path)) ||
    sellerPaths.some((path) => location.pathname.startsWith(path));

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/Checkout" element={<Checkout />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/AccountPage" element={<AccountPage />} />
        <Route path="/ProductListingPage" element={<ProductListingPage />} />

        {/* Seller Routes (Dynamic using sellerId) */}
        <Route path="/DashboardSeller/:sellerId/*">
          <Route index element={<DashboardSeller />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<ProfileManagement />} />
          <Route path="addProduct" element={<AddProduct />} />
        </Route>

        {/* Optionally, a separate route for SellerProducts if you need it */}
        <Route path="Editproducts" element={<ProductManagement />} />

        {/* Admin Routes (Protected) */}
        <Route element={<PrivateAdminRoute><AdminLayout /></PrivateAdminRoute>}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/produits" element={<ProductsAdmin />} />
          <Route path="/commandes" element={<OrdersAdmin />} />
          <Route path="/clients" element={<ClientsAdmin />} />
          <Route path="/paiements" element={<PaymentsAdmin />} />
          <Route path="/transactions" element={<TransactionsAdmin />} />
        </Route>
      </Routes>
      {!hideHeaderFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <LayoutWrapper />
    </Router>
  );
}

export default App;