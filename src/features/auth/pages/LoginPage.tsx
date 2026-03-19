// src/features/auth/pages/LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginApi } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";
import PublicLayout from "../../../shared/components/layout/PublicLayout";

// Define user types
interface User {
  name: string;
  email: string;
  role: "ADMIN" | "AGENT" | "BILLER";
}

interface LoginResponse {
  user: User;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const navigate = useNavigate();

  // Redirect logged-in users based on role
  useEffect(() => {
    if (token) {
      const userRole = useAuthStore.getState().user?.role;
      if (userRole === "ADMIN") navigate("/admin/dashboard");
      else if (userRole === "AGENT") navigate("/agent/dashboard");
      else if (userRole === "BILLER") navigate("/biller/dashboard");
    }
  }, [token, navigate]);

  const validateFields = () => {
    const errors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Invalid email format";
      isValid = false;
    }

    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleLogin = async () => {
    setApiError("");
    if (!validateFields()) return;

    setLoading(true);
    try {
      const data: LoginResponse = await loginApi(email, password);

      // Save user & token in store
      login(data.user);

      // Navigate based on role
      switch (data.user.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "AGENT":
          navigate("/agent/dashboard");
          break;
        case "BILLER":
          navigate("/biller/dashboard");
          break;
        default:
          setApiError("Unknown user role");
      }
    } catch (err: any) {
      setApiError(err.message || "Invalid credentials or network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-center text-red-600">
            WELCOME TO DERASH
          </h2>
          <h2 className="text-2xl font-bold text-center text-red-600">Log In</h2>

          {apiError && (
            <div className="bg-red-100 text-red-700 p-2 rounded text-sm text-center">
              {apiError}
            </div>
          )}

          <div className="space-y-4">
            {/* Email input */}
            <div>
              <input
                type="email"
                className={`w-full border rounded p-3 outline-none focus:ring-2 ${
                  fieldErrors.email
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-red-400"
                }`}
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password input */}
            <div>
              <input
                type="password"
                className={`w-full border rounded p-3 outline-none focus:ring-2 ${
                  fieldErrors.password
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 focus:ring-red-400"
                }`}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, password: "" }));
                }}
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Login button */}
            <button
              className={`w-full rounded-lg py-3 font-semibold text-white ${
                loading
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>

          {/* Links */}
          <p className="text-sm text-gray-500 text-center">
            Forgot your password?{" "}
            <Link to="/forgot-password" className="text-red-600 hover:underline">
              Reset here
            </Link>
          </p>

          <p className="text-sm text-gray-500 text-center">
            Don’t have an account?{" "}
            <Link to="/register" className="text-red-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}