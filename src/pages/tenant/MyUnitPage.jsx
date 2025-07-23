// frontend/src/pages/tenant/MyUnitPage.jsx

import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as unitService from "../../services/unitService.js";
import * as userService from "../../services/userService.js";
import Button from "../../components/common/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";

// Brand colors for consistency
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

function MyUnitPage() {
  const { unitId } = useParams();
  const { showError } = useGlobalAlert();
  
  // Fetch user profile to check authorization and get property ID
  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userService.getMyProfile(),
    onError: (error) => {
      showError("Failed to load profile: " + (error.message || "Unknown error"));
    }
  });
  
  // Find the relevant tenancy for this unit
  const tenancy = profile?.associations?.tenancies?.find(t => t.unit?._id === unitId);
  const propertyId = tenancy?.property?._id;
  
  // Only fetch unit details if we have authorization (propertyId found)
  const { data: unit, isLoading: unitLoading, isError: unitError } = useQuery({
    queryKey: ['unit', propertyId, unitId],
    queryFn: () => unitService.getUnitById(propertyId, unitId),
    enabled: !!propertyId && !!unitId,
    onError: (error) => {
      showError("Failed to load unit details: " + (error.message || "Unknown error"));
    }
  });

  const isLoading = profileLoading || unitLoading;
  const isError = profileError || unitError;
  const isAuthorized = !!tenancy && !!propertyId;

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
        <p className="ml-4 text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
          Loading unit details...
        </p>
      </div>
    );
  }

  // --- Access Restricted ---
  if (!isAuthorized) {
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
  if (isError) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl shadow-lg max-w-lg text-center border" style={{ borderColor: "#ff6b6b" }}>
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>Failed to load unit details. Please try again later.</p>
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

  // Format unit for display using service function if available
  const formattedUnit = unitService.formatUnit ? unitService.formatUnit(unit) : unit;

  // --- Main Display ---
  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Unit: {formattedUnit.unitName}
        {formattedUnit.property && (
          <span className="text-xl text-gray-600 ml-4">
            ({formattedUnit.property.name})
          </span>
        )}
      </h1>

      <div
        className="bg-white p-8 rounded-xl shadow-lg border max-w-3xl mx-auto"
        style={{ borderColor: PRIMARY_COLOR + "20" }}
      >
        <div className="space-y-4 text-gray-700 text-lg">
          <p>
            <strong>Property:</strong> {formattedUnit.property?.name || "N/A"}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {[
              formattedUnit.property?.address?.street,
              formattedUnit.property?.address?.city,
              formattedUnit.property?.address?.state,
              formattedUnit.property?.address?.country
            ].filter(Boolean).join(", ") || "N/A"}
          </p>
          <p>
            <strong>Unit Name:</strong> {formattedUnit.unitName}
          </p>
          <p>
            <strong>Floor:</strong> {formattedUnit.floor || "N/A"}
          </p>
          <p>
            <strong>Details:</strong> {formattedUnit.details || "No additional details."}
          </p>
          <p>
            <strong>Bedrooms:</strong> {formattedUnit.numBedrooms ?? "N/A"}
          </p>
          <p>
            <strong>Bathrooms:</strong> {formattedUnit.numBathrooms ?? "N/A"}
          </p>
          <p>
            <strong>Square Footage:</strong>{" "}
            {formattedUnit.squareFootage ? `${formattedUnit.squareFootage} sq ft` : "N/A"}
          </p>
          <p>
            <strong>Rent Amount:</strong>{" "}
            {formattedUnit.formattedRent || (formattedUnit.rentAmount ? `$${formattedUnit.rentAmount.toLocaleString()}` : "N/A")}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={`capitalize ${formattedUnit.statusClass || ""}`}>
              {formattedUnit.status}
            </span>
          </p>

          {/* Display current tenants if any (excluding self if this is a shared unit) */}
          {formattedUnit.tenants && formattedUnit.tenants.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-xl font-semibold mb-3">Occupants:</h3>
              <ul className="list-disc list-inside space-y-1">
                {formattedUnit.tenants.map((t) => (
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
            to={`/tenant/requests/add?propertyId=${formattedUnit.property?._id}&unitId=${formattedUnit._id}`}
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