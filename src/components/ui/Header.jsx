import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import {
  MdFavoriteBorder,
  MdOutlineShoppingCart,
  MdAccountCircle,
  MdLogout,
} from "react-icons/md";

const Header = () => {
  const navigate = useNavigate();
  const [sellerId, setSellerId] = useState(null);
  const [user, setUser] = useState(null);
  const [links, setLinks] = useState({
    home: true,
    about: false,
    contact: false,
    signup: false,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);
  const searchWrapperRef = useRef(null);

  // Close recommendations when clicking outside the search wrapper
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setRecommendationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchSellerProfile(token);
    } else {
      setUser(null);
      setSellerId(null);
    }
  }, []);

  // Fetch seller profile using the provided token
  const fetchSellerProfile = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch user profile");
      const userData = await res.json();
      setUser(userData);
      setSellerId(userData._id);
    } catch (err) {
      console.error("Error fetching seller ID:", err.message);
      setUser(null);
      setSellerId(null);
    }
  };

  // Navigate to the seller dashboard (protected)
  const handleDashboardNavigation = () => {
    if (user && sellerId) {
      navigate(`/DashboardSeller/${sellerId}`);
    } else {
      alert("You must be logged in to access the seller dashboard.");
      navigate("/login");
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setSellerId(null);
    navigate("/login");
  };

  // Navigation for navbar links
  const linkNavbar = (e, name) => {
    e.preventDefault();
    setLinks({
      home: name === "home",
      about: name === "about",
      contact: name === "contact",
      signup: name === "signup",
    });
    if (name === "signup") {
      navigate("/login");
    } else {
      navigate(`/${name === "home" ? "" : name}`);
    }
  };

  // Search logic
  const fetchRecommendations = async (query) => {
    if (!query.trim() || query.trim().length < 2) {
      setRecommendations([]);
      setRecommendationsOpen(false);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/products/search?q=${encodeURIComponent(
          query
        )}`
      );
      if (!response.ok)
        throw new Error("Failed to fetch recommendations");
      const result = await response.json();
      setRecommendations(result.data.slice(0, 5));
      setRecommendationsOpen(true);
    } catch (error) {
      console.error("Error fetching recommendations:", error.message);
      setRecommendations([]);
      setRecommendationsOpen(false);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchTerm(query);
    fetchRecommendations(query);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = inputRef.current?.value.trim();
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setRecommendationsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className="nav-container">
      <header className="navbar">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          <img src="/src/assets/logoMC.png" alt="Logo" className="logo-img" />
        </div>

        {/* Navigation Links */}
        <div className="navbar-center">
          <nav className="navbar-links">
            <a href="/" onClick={(e) => linkNavbar(e, "home")}>
              Home {links.home && <div className="lineUnder"></div>}
            </a>
            <a href="/About" onClick={(e) => linkNavbar(e, "about")}>
              About {links.about && <div className="lineUnder"></div>}
            </a>
            <a href="/Contact" onClick={(e) => linkNavbar(e, "contact")}>
              Contact {links.contact && <div className="lineUnder"></div>}
            </a>
            {!user && (
              <a href="/login" onClick={(e) => linkNavbar(e, "signup")}>
                Login {links.signup && <div className="lineUnder"></div>}
              </a>
            )}
          </nav>
        </div>

        {/* Search and Icons */}
        <div className="navbar-right">
          <div className="search-wrapper" ref={searchWrapperRef}>
            <input
              type="text"
              placeholder="Que cherchez-vous ?"
              className="modern-search-input"
              ref={inputRef}
              value={searchTerm}
              onChange={handleInputChange}
            />
            {recommendationsOpen && recommendations.length > 0 && (
              <ul className="recommendations-dropdown">
                {recommendations.map((product) => (
                  <li
                    key={product._id}
                    onClick={() => navigate(`/products/${product._id}`)}
                  >
                    <img
                      src={
                        product.image && product.image.length > 0
                          ? product.image[0]
                          : "https://via.placeholder.com/50x50"
                      }
                      alt={product.name}
                    />
                    <div>
                      <p>{product.name}</p>
                      <p>${product.price.toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
<div className="navbar-icons">
            {user && (
              <MdFavoriteBorder
                onClick={handleDashboardNavigation}
                className="fav-logo"
                title="Seller Dashboard"
              />
            )}
            <MdOutlineShoppingCart className="cart-logo" onClick={() => navigate("/cart")} title="Panier" />
            {user && (
              <>
                <MdAccountCircle
                  className="profile-logo"
                  onClick={() => navigate("/AccountPage")}
                  title="Mon Compte"
                />
                <MdLogout
                  className="logout-icon"
                  onClick={handleLogout}
                  title="Déconnexion"
                />
              </>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
