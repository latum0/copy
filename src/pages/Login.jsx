import React, { useState } from "react";
import "./Login.css";
import CardImage from "../components/ui/cardimage";
import FormContainer from "../components/ui/FormContainer";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Merge the guest cart with the backend cart after login.
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

  const handleSubmit = async ({ email, password }) => {
    try {
      const response = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });
      const user = response.data.user;
      const token = response.data.token;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Merge any guest cart items into the backend.
      await mergeGuestCartWithServer(token);

      if (user.role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(err.response.data.message || "Une erreur s'est produite.");
      } else {
        setError("Une erreur de connexion est survenue.");
      }
    }
  };

  return (
    <div className="loginWrapper slide-page-right">
      <div className="authCard">
        <CardImage />
        <FormContainer
          title="Welcome Back"
          subtitle="Please log in to your account"
          showNameInput={false}
          buttonText="Log In"
          linkText="Don't have an account?"
          linkUrl="/signup"
          linkLabel="Sign up"
          onSubmit={handleSubmit}
          errorMessage={error}
        />
      </div>
    </div>
  );
}
