import { useEffect, useState } from "react";
import axios from "../../api/axios";

const TenantApproval = () => {
    const [tenants, setTenants] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // Fetch unapproved tenants
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const response = await axios.get("/api/tenants/pending");
                setTenants(response.data.tenants);
            } catch (error) {
                setError("Failed to load tenants");
            }
        };
        fetchTenants();
    }, []);

    // Approve a tenant
    const approveTenant = async (tenantId) => {
        try {
            await axios.post("/api/auth/approve-tenant", { tenantId });
            setTenants(tenants.filter((tenant) => tenant._id !== tenantId));
            setMessage("Tenant approved successfully");
            setError("");
        } catch (error) {
            setError(error.response?.data?.message || "Approval failed");
            setMessage("");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
            <h2 className="text-2xl font-bold mb-4 text-center">Tenant Approvals</h2>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {message && <p className="text-green-500 mb-4">{message}</p>}

            <ul>
                {tenants.map((tenant) => (
                    <li key={tenant._id} className="mb-4 flex justify-between items-center border-b pb-2">
                        <div>
                            <p>{tenant.name}</p>
                            <p className="text-sm text-gray-500">{tenant.email}</p>
                        </div>
                        <button
                            onClick={() => approveTenant(tenant._id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                            Approve
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TenantApproval;