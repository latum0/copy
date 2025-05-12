"use client"

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import "./Checkout.css"

const Checkout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { cartItems = [], total = 0 } = location.state || {}

  if (!location.state || cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-cart-warning">
          <h2>Votre panier est vide</h2>
          <button onClick={() => navigate("/cart")}>Retour au panier</button>
        </div>
      </div>
    )
  }

  const [formData, setFormData] = useState({
    city: "",
    phoneNumber: "",
    email: "",
    saveInfo: true,
    paymentMethod: "card",
  })

  const [selectedCard, setSelectedCard] = useState("visa")
  const [couponCode, setCouponCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handlePaymentMethodChange = (method) => {
    setFormData({ ...formData, paymentMethod: method })
  }

  const handleCardSelection = (card) => {
    setSelectedCard(card)
  }

  const handleApplyCoupon = () => {
    if (couponCode.trim() === "") {
      alert("Veuillez entrer un code promo")
      return
    }
    alert(`Code promo "${couponCode}" appliqué!`)
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // 1. Préparation des données
    const orderItems = cartItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
      seller: item.product.seller
    }));

    // 2. Envoi à l'API avec l'URL directe
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        items: orderItems,
        shippingInfo: {
          city: formData.city,
          phone: formData.phoneNumber,
          email: formData.email
        },
        paymentMethod: formData.paymentMethod
      })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Erreur inconnue");

    // 3. Vérification en base de données
    const verification = await fetch(`http://localhost:5000/api/orders/${data.orderId}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
  }
});
    const verifiedOrder = await verification.json();

    if (!verification.ok || !verifiedOrder) {
      throw new Error("La commande n'a pas été trouvée en base de données");
    }

    alert("Commande passée avec succès!");
    navigate(`/`);

  } catch (error) {
    console.error("Erreur complète:", error);
    alert(`Échec de la commande: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-grid">
          <div className="order-form">
            <h1 className="page-title">Passer une commande</h1>
            
            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="city">
                  Ville / Localité <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">
                  Numéro de téléphone <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Adresse e-mail <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="saveInfo"
                  name="saveInfo"
                  checked={formData.saveInfo}
                  onChange={handleInputChange}
                />
                <label htmlFor="saveInfo">Enregistrer ces informations pour la prochaine fois</label>
              </div>
            </form>
          </div>

          <div className="order-summary">
            <div className="summary-item">
              <span>Livraison:</span>
              <span className="summary-value">Gratuite</span>
            </div>

            <div className="summary-item total">
              <span>Total:</span>
              <span className="summary-value">{total.toFixed(2)} €</span>
            </div>

            <div className="payment-section">
              <h2>Méthode de paiement</h2>
              <div className="payment-options">
                <div className="payment-option">
                  <div className="payment-radio">
                    <input
                      type="radio"
                      id="card-payment"
                      name="payment-method"
                      checked={formData.paymentMethod === "card"}
                      onChange={() => handlePaymentMethodChange("card")}
                    />
                    <label htmlFor="card-payment">Carte bancaire</label>
                  </div>
                </div>

                {formData.paymentMethod === "card" && (
                  <div className="card-selection">
                    <button
                      type="button"
                      className={`card-button ${selectedCard === "visa" ? "selected" : ""}`}
                      onClick={() => handleCardSelection("visa")}
                    >
                      <div className="card-logo visa">VISA</div>
                      <span className="card-name">Visa</span>
                    </button>

                    <button
                      type="button"
                      className={`card-button ${selectedCard === "mastercard" ? "selected" : ""}`}
                      onClick={() => handleCardSelection("mastercard")}
                    >
                      <div className="card-logo mastercard"></div>
                      <span className="card-name">Mastercard</span>
                    </button>
                  </div>
                )}

                <div className="payment-option">
                  <div className="payment-radio">
                    <input
                      type="radio"
                      id="cash-payment"
                      name="payment-method"
                      checked={formData.paymentMethod === "cash"}
                      onChange={() => handlePaymentMethodChange("cash")}
                    />
                    <label htmlFor="cash-payment">
                      Paiement à la livraison
                    </label>
                  </div>
                </div>
              </div>

              <div className="coupon-section">
                <input
                  type="text"
                  placeholder="Code promo"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <button 
                  className="apply-coupon" 
                  onClick={handleApplyCoupon}
                  type="button"
                >
                  Appliquer
                </button>
              </div>

              <button 
                className="place-order-btn" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Traitement..." : "Passer la commande"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout