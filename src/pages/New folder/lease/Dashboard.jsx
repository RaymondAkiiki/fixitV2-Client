import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLease } from "../../contexts/LeaseContext";
import { useRent } from "../../contexts/RentContext";
import { useNotifications } from "../../contexts/NotificationContext";
import LeaseCard from "../../components/LeaseCard";
import PaymentCard from "../../components/PaymentCard";
import NotificationItem from "../../components/NotificationItem";

const Dashboard = () => {
  const { user } = useAuth();
  const { leases, loading: loadingLeases } = useLease();
  const { rents, loading: loadingPayments } = useRent();
  const { notifications, loading: loadingNotifs } = useNotifications();

  return (
    <div>
      <h2>Welcome, {user?.name}!</h2>
      <div style={{ display: "flex", gap: "2rem", marginTop: 24, flexWrap: "wrap" }}>
        <section style={{ flex: 1 }}>
          <h3>Leases</h3>
          {loadingLeases ? "Loading..." :
            leases.length ? leases.map(l => <LeaseCard key={l._id} lease={l} />) :
            <div>No leases found.</div>}
        </section>
        <section style={{ flex: 1 }}>
          <h3>Payment Ledger</h3>
          {loadingPayments ? "Loading..." :
            rents.length ? rents.map(p => <PaymentCard key={p._id} rent={p} />) :
            <div>No Payment payments.</div>}
        </section>
        <section style={{ flex: 1 }}>
          <h3>Notifications</h3>
          {loadingNotifs ? "Loading..." :
            notifications.length ? notifications.slice(0, 5).map(n => <NotificationItem key={n._id} notification={n} />) :
            <div>No notifications.</div>}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;