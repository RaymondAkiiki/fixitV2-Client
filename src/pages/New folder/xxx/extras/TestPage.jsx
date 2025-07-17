export default function TestPage() {
  const styles = {
    page: {
      fontFamily: "sans-serif",
      padding: "2rem",
      backgroundColor: "#f9fafb",
      minHeight: "100vh",
    },
    header: {
      fontSize: "2rem",
      fontWeight: "bold",
      marginBottom: "1rem",
    },
    card: {
      backgroundColor: "white",
      padding: "1.5rem",
      borderRadius: "1rem",
      boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      marginBottom: "1rem",
      maxWidth: "600px",
    },
    button: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.5rem",
      backgroundColor: "#2563eb",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontWeight: "600",
      marginTop: "1rem",
    },
    footer: {
      marginTop: "2rem",
      fontSize: "0.9rem",
      color: "#6b7280",
    },
  };

  const handleClick = () => {
    alert("Button clicked!");
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>🧪 Test Page</div>

      <div style={styles.card}>
        <p>This is a simple card with some placeholder text.</p>
        <p>You can use this page to quickly test components.</p>
        <button style={styles.button} onClick={handleClick}>
          Click Me
        </button>
      </div>

      <div style={styles.footer}>Designed for testing. No imports required.</div>
    </div>
  );
}
