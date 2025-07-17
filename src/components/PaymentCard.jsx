import React from "react";

const PaymentCard = ({ payment }) => {
  if (!payment) return null;
  const paid = payment.status === "paid";
  return (
    <div
      className="Payment-card"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1.2rem",
        marginBottom: "1rem",
        background: paid ? "#dcfce7" : "#fef9c3"
      }}
    >
      <div>
        <b>Due:</b> {payment.dueDate && new Date(payment.dueDate).toLocaleDateString()}
      </div>
      <div>
        <b>Amount:</b> ${payment.amount?.toLocaleString()}
      </div>
      <div>
        <b>Status:</b>{" "}
        <span style={{ color: paid ? "#16a34a" : "#b45309", fontWeight: 600 }}>
          {paid ? "Paid" : "Due"}
        </span>
      </div>
      {payment.paidDate && (
        <div>
          <b>Paid On:</b> {new Date(payment.paidDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default PaymentCard;