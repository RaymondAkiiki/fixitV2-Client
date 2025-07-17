import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => (
  <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center" }}>
    <h1>LeaseLogix</h1>
    <p>
      Streamline rental management for landlords, tenants, and property managers.<br />
      Manage properties, leases, payments, and onboarding—all in one secure platform.
    </p>
    <div style={{ marginTop: "2rem" }}>
      <Link to="/login" style={{ marginRight: 20, fontWeight: "bold" }}>Sign In</Link>
      <Link to="/register" style={{ fontWeight: "bold" }}>Sign Up</Link>
    </div>
  </div>
);

export default LandingPage;