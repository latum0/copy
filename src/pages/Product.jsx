"use client"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import "./Product.css"
import {
  MdFavoriteBorder,
  MdFavorite,
  MdOutlineShoppingCart,
  MdLocalShipping,
  MdSecurity,
  MdLoop,
} from "react-icons/md"
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaPinterestP,
  FaWhatsapp,
  FaCheck,
  FaMinus,
  FaPlus,
} from "react-icons/fa"
import Diviser from "../components/ui/Diviser"
import Card from "../components/ui/Card"

const Product = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [activeTab, setActiveTab] = useState("description")
  const [currentImage, setCurrentImage] = useState(0)

  // Cart state
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    const checkCartStatus = () => {
      const token = localStorage.getItem("token")
      if (token) {
        fetch("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((response) => {
            if (!response.ok) return
            return response.json()
          })
          .then((cart) => {
            const isInCart = cart?.items?.some((item) => item.product._id === id)
            setIsAdded(isInCart)
          })
      } else {
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]")
        setIsAdded(guestCart.some((item) => item.productId === id))
      }
    }

    const fetchData = async () => {
      try {
        // Fetch main product
        const productResponse = await fetch(`http://localhost:5000/api/products/${id}`)
        if (!productResponse.ok) throw new Error("Product not found")
        const productData = await productResponse.json()
        setProduct(productData.data)
        checkCartStatus()

        // Fetch related products
        const relatedResponse = await fetch(
          `http://localhost:5000/api/products?category=${productData.data.category}&limit=5`,
        )
        const relatedData = await relatedResponse.json()

        const filteredRelated = relatedData.data.filter((item) => item._id !== productData.data._id).slice(0, 4)

        setRelatedProducts(filteredRelated)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token")

    try {
      if (token) {
        // Authenticated user
        const response = await fetch("http://localhost:5000/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: id,
            quantity: quantity,
          }),
        })

        if (!response.ok) throw new Error("Failed to add to cart")
        setIsAdded(true)
        alert(`${quantity} item(s) added to cart!`)
      } else {
        // Guest user
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]")
        const existingItem = guestCart.find((item) => item.productId === id)

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          guestCart.push({
            productId: id,
            quantity: quantity,
            product: {
              name: product.name,
              price: product.price,
              image: product.image,
            },
          })
        }

        localStorage.setItem("guestCart", JSON.stringify(guestCart))
        setIsAdded(true)
        alert(`${quantity} item(s) added to cart!`)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  // Generate multiple images for demo purposes
  const generateImages = (mainImage) => {
    if (!mainImage) return ["/placeholder.svg"]

    // For demo, create an array with the same image
    return [mainImage, mainImage, mainImage, mainImage]
  }

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    )

  if (error)
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Try Again
        </button>
      </div>
    )

  if (!product) return <div className="not-found">Product not found</div>

  const productImages = generateImages(product.image)
  const discountPercentage = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0

  return (
    <div className="product-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/category/components">Core Components</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to={`/category/${product.category}`}>{product.category}</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">{product.name}</span>
      </div>

      <div className="product-main">
        {/* Image Gallery Section */}
        <div className="image-gallery-section">
          {discountPercentage > 0 && <div className="discount-badge">-{discountPercentage}%</div>}

          <div className="main-image-container">
            <img
              src={productImages[currentImage] || "/placeholder.svg"}
              alt={product.name}
              className="main-product-image"
            />
            <div className="image-zoom-hint">
              <span className="zoom-icon">🔍</span>
              <span>Hover to zoom</span>
            </div>
          </div>

          <div className="thumbnail-gallery">
            {productImages.map((img, index) => (
              <div
                key={index}
                className={`thumbnail-item ${currentImage === index ? "active" : ""}`}
                onClick={() => setCurrentImage(index)}
              >
                <img src={img || "/placeholder.svg"} alt={`${product.name} - view ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="product-info-section">
          <div className="product-brand">{product.brand || "ASUS"}</div>
          <h1 className="product-title">{product.name}</h1>

          <div className="product-rating">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`star ${star <= 4 ? "filled" : ""}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="rating-count">(24 reviews)</span>
          </div>

          <div className="price-section">
            {product.salePrice ? (
              <>
                <span className="original-price">{product.price.toFixed(2)} DA</span>
                <span className="current-price">{product.salePrice.toFixed(2)} DA</span>
                <span className="discount-tag">Save {discountPercentage}%</span>
              </>
            ) : (
              <span className="current-price">{product.price.toFixed(2)} DA</span>
            )}
          </div>

          {/* Price Alert Button */}
          <button className="price-alert-btn">
            <span role="img" aria-label="alert">
              🔔
            </span>{" "}
            Didn't Like The Price?
          </button>

          <div className="stock-status">
            <span className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
              {product.stock > 0 ? "In stock" : "Out of Stock"}
            </span>
          </div>

          {/* Product Actions - Quantity and Buttons */}
          <div className="product-actions" style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <div className="quantity-selector">
              <button
                className="quantity-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <FaMinus />
              </button>
              <input type="text" value={quantity} readOnly className="quantity-input" />
              <button className="quantity-btn" onClick={() => setQuantity((q) => q + 1)}>
                <FaPlus />
              </button>
            </div>

            {/* Action Buttons - Force display with inline styles */}
            <div className="action-buttons" style={{ display: "flex", gap: "1rem", marginTop: "1rem", width: "100%" }}>
              <button
                className={`add-to-cart-btn ${isAdded ? "added" : ""}`}
                onClick={handleAddToCart}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "48px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                }}
              >
                {isAdded ? (
                  <>
                    <FaCheck className="btn-icon" />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <MdOutlineShoppingCart className="btn-icon" />
                    <span>Add To Cart</span>
                  </>
                )}
              </button>

              <button
                className="buy-now-btn"
                onClick={() => alert("Proceed to buy")}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "48px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                }}
              >
                Buy Now
              </button>
            </div>
          </div>

          <button className={`wishlist-btn ${isLiked ? "active" : ""}`} onClick={() => setIsLiked(!isLiked)}>
            {isLiked ? <MdFavorite className="heart-icon" /> : <MdFavoriteBorder className="heart-icon" />}
            <span>{isLiked ? "Added to Wishlist" : "Add to Wishlist"}</span>
          </button>

          <div className="product-benefits">
            <div className="benefit-item">
              <MdLocalShipping className="benefit-icon" />
              <div className="benefit-text">
                <h4>Free Shipping</h4>
                <p>On orders over 10,000 DA</p>
              </div>
            </div>
            <div className="benefit-item">
              <MdLoop className="benefit-icon" />
              <div className="benefit-text">
                <h4>Easy Returns</h4>
                <p>30-day return policy</p>
              </div>
            </div>
            <div className="benefit-item">
              <MdSecurity className="benefit-icon" />
              <div className="benefit-text">
                <h4>Secure Checkout</h4>
                <p>100% Protected Payments</p>
              </div>
            </div>
          </div>

          <div className="product-meta">
            <div className="meta-item">
              <span className="meta-label">SKU:</span>
              <span className="meta-value">{product._id.substring(0, 5) || "03684"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Category:</span>
              <span className="meta-value">{product.category || "Motherboards"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Brand:</span>
              <span className="meta-value">{product.brand || "ASUS"}</span>
            </div>
          </div>

          <div className="social-share">
            <span className="share-label">Share:</span>
            <div className="share-icons">
              <a href="#" className="share-icon facebook">
                <FaFacebookF />
              </a>
              <a href="#" className="share-icon twitter">
                <FaTwitter />
              </a>
              <a href="#" className="share-icon linkedin">
                <FaLinkedinIn />
              </a>
              <a href="#" className="share-icon pinterest">
                <FaPinterestP />
              </a>
              <a href="#" className="share-icon whatsapp">
                <FaWhatsapp />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="product-details-tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
            onClick={() => setActiveTab("description")}
          >
            Description
          </button>
          <button
            className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
            onClick={() => setActiveTab("specifications")}
          >
            Specifications
          </button>
          <button
            className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews (24)
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === "description" && (
            <div className="tab-pane">
              <p>{product.description}</p>
              <p>
                The ASUS TUF GAMING X670E-PLUS WIFI motherboard delivers rock-solid performance with a robust power
                solution, comprehensive cooling, and extensive connectivity options. Built with military-grade
                components, this motherboard is designed for durability and reliability.
              </p>
              <p>
                Featuring PCIe 5.0, DDR5 memory support, and WiFi 6E connectivity, the TUF GAMING X670E-PLUS WIFI
                provides cutting-edge performance for AMD Ryzen 7000 series processors.
              </p>
            </div>
          )}

          {activeTab === "specifications" && (
            <div className="tab-pane">
              <div className="specs-grid">
                <div className="spec-group">
                  <h3>CPU</h3>
                  <p>AMD AM5 Socket for AMD Ryzen 7000 Series Desktop Processors</p>
                </div>
                <div className="spec-group">
                  <h3>Chipset</h3>
                  <p>AMD X670E Chipset</p>
                </div>
                <div className="spec-group">
                  <h3>Memory</h3>
                  <p>
                    4 x DIMM, Max. 128GB, DDR5 6400+(OC)/6200(OC)/6000(OC)/5800(OC)/5600/5400/5200/5000/4800 Non-ECC,
                    Un-buffered Memory
                  </p>
                </div>
                <div className="spec-group">
                  <h3>Expansion Slots</h3>
                  <p>
                    1 x PCIe 5.0 x16 slot
                    <br />1 x PCIe 4.0 x16 slot (x4 mode)
                    <br />1 x PCIe 3.0 x1 slot
                  </p>
                </div>
                <div className="spec-group">
                  <h3>Storage</h3>
                  <p>
                    4 x M.2 slots (PCIe 4.0 x4)
                    <br />4 x SATA 6Gb/s ports
                  </p>
                </div>
                <div className="spec-group">
                  <h3>Networking</h3>
                  <p>
                    1 x 2.5Gb Ethernet
                    <br />
                    WiFi 6E (802.11a/b/g/n/ac/ax)
                    <br />
                    Bluetooth 5.2
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="tab-pane">
              <div className="reviews-summary">
                <div className="rating-summary">
                  <div className="average-rating">4.0</div>
                  <div className="stars-summary">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={`star ${star <= 4 ? "filled" : ""}`}>
                        ★
                      </span>
                    ))}
                    <span className="total-reviews">Based on 24 reviews</span>
                  </div>
                </div>
                <button className="write-review-btn">Write a Review</button>
              </div>

              <div className="reviews-list">
                {[
                  {
                    name: "Ahmed K.",
                    date: "May 2, 2025",
                    rating: 5,
                    title: "Excellent motherboard for my Ryzen 9 build",
                    content:
                      "I've been using this motherboard for about a month now with a Ryzen 9 7900X and it's been rock solid. The BIOS is easy to navigate, and the board has all the features I need.",
                  },
                  {
                    name: "Sarah L.",
                    date: "April 15, 2025",
                    rating: 4,
                    title: "Good value for an X670E board",
                    content:
                      "This is a solid motherboard with good features for the price. The only reason I'm giving it 4 stars instead of 5 is because the M.2 heatsinks are a bit finicky to install.",
                  },
                  {
                    name: "Mohammed R.",
                    date: "March 28, 2025",
                    rating: 3,
                    title: "Decent board but BIOS issues",
                    content:
                      "The hardware is good quality, but I had some issues with the BIOS that required updating. After the update things have been better, but it was frustrating to deal with initially.",
                  },
                ].map((review, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <h4>{review.name}</h4>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className={`star ${star <= review.rating ? "filled" : ""}`}>
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <h3 className="review-title">{review.title}</h3>
                    <p className="review-content">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Diviser name="Related Products" />
      <div className="related-products">
        {relatedProducts.map((relatedProduct) => (
          <Card
            key={relatedProduct._id}
            id={relatedProduct._id}
            name={relatedProduct.name}
            price={relatedProduct.price}
            img={relatedProduct.image}
          />
        ))}
      </div>
    </div>
  )
}

export default Product
