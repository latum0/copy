import React, { useState } from "react";
import "./Signup.css";
import CardImage from "../components/ui/cardimage";
import FormContainer from "../components/ui/FormContainer";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Merge the guest cart with the backend cart after signup.
  const mergeGuestCartWithServer = async (token) => {
    const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
    if (guestCart.length > 0) {
      await Promise.all(
        guestCart.map(async (item) => {
          try {
            await axios.post("http://localhost:5000/api/cart", item, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (error) {
            console.error("Error merging cart item:", item, error);
          }
        })
      );
      localStorage.removeItem("guestCart");
    }
  };

  const handleSubmit = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/users/signup", {
        name,
        email,
        password,
      });
      const token = response.data.token;
      localStorage.setItem("token", token);

      // Merge the guest cart now that the user is signed up.
      await mergeGuestCartWithServer(token);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signupWrapper slide-page">
      <div className="authCard">
        <CardImage />
        <FormContainer
          title="Create an account"
          subtitle="Enter your details below"
          showNameInput={true}
          buttonText={loading ? "Signing up..." : "Sign up"}
          linkText="Already have an account?"
          linkUrl="/login"
          linkLabel="Log in"
          onSubmit={handleSubmit}
        />
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
