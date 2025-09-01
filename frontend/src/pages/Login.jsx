import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        setError("");
        navigate(`/${data.role}`, { state: { email: data.email } });
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="block w-full mb-4 p-2 border rounded-lg"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          className="block w-full mb-4 p-2 border rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="block w-full mb-4 p-2 border rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button
          onClick={handleSignIn}
          className="w-full bg-blue-500 text-white p-2 rounded-lg"
        >
          Login
        </button>
      </div>
    </div>
  );
}
