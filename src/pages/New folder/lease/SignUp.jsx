// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "../services/axiosInstance";

// const SignUp = () => {
//     const [name, setName] = useState("");
//     const [email, setEmail] = useState("");
//     const [password, setPassword] = useState("");
//     const [properties, setProperties] = useState([]);
//     const [propertyId, setPropertyId] = useState("");
//     const [error, setError] = useState("");
//     const [message, setMessage] = useState("");
//     const navigate = useNavigate();

//     // Fetch properties for the dropdown
//     useEffect(() => {
//         const fetchProperties = async () => {
//             try {
//                 const response = await axios.get("/api/properties");
//                 setProperties(response.data.properties);
//             } catch (error) {
//                 setError("Failed to load properties");
//             }
//         };
//         fetchProperties();
//     }, []);

//     // Handle tenant sign-up
//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         try {
//             const response = await axios.post("/api/auth/tenant-signup", {
//                 name,
//                 email,
//                 password,
//                 propertyId,
//             });
//             setMessage(response.data.message);
//             setError("");
//             setName("");
//             setEmail("");
//             setPassword("");
//             setPropertyId("");
//             setTimeout(() => navigate("/signin"), 3000);
//         } catch (error) {
//             setError(error.response?.data?.message || "Signup failed");
//             setMessage("");
//         }
//     };

//     return (
//         <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
//             <h2 className="text-2xl font-bold mb-4 text-center">Tenant Sign-Up</h2>

//             {error && <p className="text-red-500 mb-4">{error}</p>}
//             {message && <p className="text-green-500 mb-4">{message}</p>}

//             <form onSubmit={handleSubmit}>
//                 <div className="mb-4">
//                     <label className="block text-sm font-semibold">Full Name</label>
//                     <input
//                         type="text"
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         className="w-full px-3 py-2 border rounded-lg"
//                         required
//                     />
//                 </div>

//                 <div className="mb-4">
//                     <label className="block text-sm font-semibold">Email</label>
//                     <input
//                         type="email"
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="w-full px-3 py-2 border rounded-lg"
//                         required
//                     />
//                 </div>

//                 <div className="mb-4">
//                     <label className="block text-sm font-semibold">Password</label>
//                     <input
//                         type="password"
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="w-full px-3 py-2 border rounded-lg"
//                         required
//                     />
//                 </div>

//                 <div className="mb-4">
//                     <label className="block text-sm font-semibold">Select Property</label>
//                     <select
//                         value={propertyId}
//                         onChange={(e) => setPropertyId(e.target.value)}
//                         className="w-full px-3 py-2 border rounded-lg"
//                         required
//                     >
//                         <option value="">Select a property</option>
//                         {properties.map((property) => (
//                             <option key={property._id} value={property._id}>
//                                 {property.name} - {property.location}
//                             </option>
//                         ))}
//                     </select>
//                 </div>

//                 <button
//                     type="submit"
//                     className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold"
//                 >
//                     Sign Up
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default SignUp;


import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const { register, loading, error } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "tenant"
  });
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const ok = await register(form);
    if (ok) navigate("/login");
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto" }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: 12, padding: 8 }}
        >
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
          <option value="property_manager">Property Manager</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: 10, background: "#1e40af", color: "#fff" }}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>
        {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
};

export default SignUp;