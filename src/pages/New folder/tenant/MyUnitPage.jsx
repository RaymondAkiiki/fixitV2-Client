import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUnitById } from "../../services/unitService";
import { getMyProfile } from "../../services/userService";
import Button from "../../components/common/Button";

// Brand colors for consistency
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

function MyUnitPage() {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const userProfile = await getMyProfile();
        setProfile(userProfile);
        const tenancy = userProfile.associations?.tenancies?.find(
          (t) => t.unit._id === unitId
        );
        if (!tenancy) {
          setError("not-authorized");
          setLoading(false);
          return;
        }
        const propertyId = tenancy.property._id;
        const unitData = await getUnitById(propertyId, unitId);
        setUnit(unitData);
      } catch (err) {
        setError(
          "Failed to load unit details: " +
            (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [unitId]);

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
          Loading unit details...
        </p>
      </div>
    );
  }

  // --- Access Restricted ---
  if (error === "not-authorized") {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-yellow-100 text-yellow-800 p-6 rounded-xl shadow-lg max-w-lg text-center border" style={{ borderColor: SECONDARY_COLOR }}>
          <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
          <p>
            <strong>You are not authorized to view this unit, or it does not exist.</strong>
          </p>
          <p className="mt-3">
            This can happen if you've not been officially linked to a property or unit yet.
          </p>
          <div className="mt-2 text-left text-base">
            <strong>What to do:</strong>
            <ul className="list-disc list-inside mt-2">
              <li>Contact your property manager if you need access.</li>
              <li>If you believe this is an error, please reach out to support.</li>
            </ul>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/tenant/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg shadow">Go to Dashboard</Button>
            </Link>
            <a href="mailto:support@yourcompany.com">
              <Button className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg shadow">Contact Support</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- Other Errors ---
  if (error) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl shadow-lg max-w-lg text-center border" style={{ borderColor: "#ff6b6b" }}>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <div className="mt-4">
            <Link to="/tenant/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg shadow">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Not found ---
  if (!unit) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded-xl shadow-lg max-w-lg text-center border" style={{ borderColor: SECONDARY_COLOR }}>
          <h2 className="text-xl font-bold mb-2">Unit Not Found</h2>
          <p>The unit you are trying to view could not be found.</p>
          <div className="mt-4">
            <Link to="/tenant/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg shadow">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Display ---
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Unit: {unit.unitName}
        {unit.property && (
          <span className="text-xl text-gray-600 ml-4">
            ({unit.property.name})
          </span>
        )}
      </h1>

      <div
        className="bg-white p-8 rounded-xl shadow-lg border max-w-3xl mx-auto"
        style={{ borderColor: PRIMARY_COLOR + "20" }}
      >
        <div className="space-y-4 text-gray-700 text-lg">
          <p>
            <strong>Property:</strong> {unit.property?.name || "N/A"}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {[unit.property?.address?.street, unit.property?.address?.city, unit.property?.address?.state, unit.property?.address?.country]
              .filter(Boolean)
              .join(", ") || "N/A"}
          </p>
          <p>
            <strong>Unit Name:</strong> {unit.unitName}
          </p>
          <p>
            <strong>Floor:</strong> {unit.floor || "N/A"}
          </p>
          <p>
            <strong>Details:</strong> {unit.details || "No additional details."}
          </p>
          <p>
            <strong>Bedrooms:</strong> {unit.numBedrooms ?? "N/A"}
          </p>
          <p>
            <strong>Bathrooms:</strong> {unit.numBathrooms ?? "N/A"}
          </p>
          <p>
            <strong>Square Footage:</strong>{" "}
            {unit.squareFootage ? `${unit.squareFootage} sq ft` : "N/A"}
          </p>
          <p>
            <strong>Rent Amount:</strong>{" "}
            {unit.rentAmount ? `$${unit.rentAmount.toLocaleString()}` : "N/A"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className="capitalize">{unit.status}</span>
          </p>

          {/* Display current tenants if any (excluding self if this is a shared unit) */}
          {unit.tenants && unit.tenants.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-xl font-semibold mb-3">Occupants:</h3>
              <ul className="list-disc list-inside space-y-1">
                {unit.tenants.map((t) => (
                  <li key={t._id}>
                    {profile && t._id === profile._id ? "You" : t.name || t.email}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to={`/tenant/requests/add?propertyId=${unit.property?._id}&unitId=${unit._id}`}
          >
            <Button className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md">
              Submit Request for this Unit
            </Button>
          </Link>
          {/* Future: Add more tenant actions here */}
        </div>
      </div>
    </div>
  );
}

export default MyUnitPage;