"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Products.css";

function Products() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    image: "",
    category: "",
    stock: "",
    status: "En stock",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownDirection, setDropdownDirection] = useState("down");

  const buttonRefs = useRef({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/products");
      console.log("Produits chargés:", response.data.data);
      setProducts(response.data.data);
    } catch (error) {
      console.error("Erreur de chargement des produits:", error);
      setErrorMessage("Impossible de charger les produits. Veuillez réessayer plus tard.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddProduct = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await axios.post("http://localhost:5000/api/products", newProduct);
      const addedProduct = response.data.data;
      setProducts([...products, addedProduct]);
      setSuccessMessage("Produit ajouté avec succès !");
      setNewProduct({
        name: "",
        price: "",
        image: "",
        category: "",
        stock: "",
        status: "En stock",
        description: "",
      });
      setTimeout(() => {
        setSuccessMessage("");
        setShowForm(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      setErrorMessage("Une erreur s'est produite lors de l'ajout du produit.");
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownToggle = (productId) => {
    if (activeDropdown === productId) {
      setActiveDropdown(null);
      return;
    }

    const buttonRef = buttonRefs.current[productId];
    if (!buttonRef) return;

    const rect = buttonRef.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 150 && spaceAbove > spaceBelow) {
      setDropdownDirection("up");
    } else {
      setDropdownDirection("down");
    }

    setActiveDropdown(productId);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`);
      setProducts(products.filter((product) => product._id !== productId));
      setActiveDropdown(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du produit:", error);
      setErrorMessage("Impossible de supprimer le produit.");
    }
  };

  const handleEditProduct = (product) => {
    console.log("Modifier le produit", product);
  };

  const handleDuplicateProduct = (product) => {
    console.log("Dupliquer le produit", product);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".actions-cell")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="products-page">
      <div className="page-header">
        <h1 className="page-title">Gestion des Produits</h1>
        <button className="button-primary" onClick={() => setShowForm(true)}>
          Ajouter un produit
        </button>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Ajouter un nouveau produit</h2>
            <input name="name" placeholder="Nom du produit" value={newProduct.name} onChange={handleInputChange} />
            <input name="price" placeholder="Prix" value={newProduct.price} onChange={handleInputChange} />
            <input name="image" placeholder="Image URL" value={newProduct.image} onChange={handleInputChange} />
            <input name="category" placeholder="Catégorie" value={newProduct.category} onChange={handleInputChange} />
            <input name="stock" placeholder="Stock" value={newProduct.stock} onChange={handleInputChange} />
            <select name="status" value={newProduct.status} onChange={handleInputChange}>
              <option value="En stock">En stock</option>
              <option value="Rupture">Rupture</option>
            </select>
            <textarea name="description" placeholder="Description du produit" value={newProduct.description} onChange={handleInputChange} />
            {successMessage && <p className="success-message">{successMessage}</p>}

            <div className="modal-actions">
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <button className="button-submit" onClick={handleAddProduct}>
                  Enregistrer
                </button>
              )}
              <button className="modal-close" onClick={() => setShowForm(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input type="text" placeholder="Rechercher des produits..." />
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Produit</th>
            <th>Catégorie</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="error-message">
                Aucun produit trouvé.
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product._id}>
                <td>
                  <img src={product.image || "/placeholder.svg"} alt={product.name} className="product-image" />
                </td>
                <td>
                  <div>{product.name}</div>
                  <div className="product-id">{product._id}</div>
                </td>
                <td>{product.category}</td>
                <td>€{product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <span className={`status-badge ${product.status === "En stock" ? "status-in-stock" : "status-out-of-stock"}`}>
                    {product.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    ref={(el) => (buttonRefs.current[product._id] = el)}
                    className="action-button"
                    onClick={() => handleDropdownToggle(product._id)}
                  >
                    ...
                  </button>
                  {activeDropdown === product._id && (
                    <div className={`dropdown-menu ${dropdownDirection}`}>
                      <div className="dropdown-item" onClick={() => handleEditProduct(product)}>
                        Modifier
                      </div>
                      <div className="dropdown-item" onClick={() => handleDuplicateProduct(product)}>
                        Dupliquer
                      </div>
                      <div className="dropdown-divider"></div>
                      <div className="dropdown-item delete-item" onClick={() => handleDeleteProduct(product._id)}>
                        Supprimer
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Products;
