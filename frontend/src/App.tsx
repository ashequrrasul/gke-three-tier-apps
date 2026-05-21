import { useEffect, useState } from "react";
import { ShoppingCart, Package, CheckCircle, AlertCircle } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        if (data.length > 0) setProductId(data[0].id);
      })
      .catch(() => {
        setMessage("Could not load products from Go backend.");
        setSuccess(false);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          productId,
          quantity,
        }),
      });

      if (!response.ok) throw new Error("Order failed");

      const data = await response.json();
      setMessage(`Order created successfully. Order ID: ${data.id}`);
      setSuccess(true);
      setCustomerName("");
      setQuantity(1);
    } catch {
      setMessage("Order API failed. Check Go backend /api/orders endpoint.");
      setSuccess(false);
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.badge}>GKE Three-Tier Application</p>
          <h1 style={styles.title}>Cloud Store</h1>
          <p style={styles.subtitle}>
            React frontend connected to Go backend and Cloud SQL database.
          </p>
        </div>

        <div style={styles.headerCard}>
          <Package size={28} />
          <div>
            <strong>{products.length}</strong>
            <p>Products Loaded</p>
          </div>
        </div>
      </header>

      {message && (
        <div
          style={{
            ...styles.message,
            background: success ? "#ecfdf5" : "#fef2f2",
            color: success ? "#047857" : "#b91c1c",
          }}
        >
          {success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message}
        </div>
      )}

      <main style={styles.layout}>
        <section>
          <h2 style={styles.sectionTitle}>Available Products</h2>

          {loading ? (
            <p>Loading products...</p>
          ) : (
            <div style={styles.grid}>
              {products.map((product) => (
                <div key={product.id} style={styles.card}>
                  <div style={styles.cardIcon}>
                    <Package size={24} />
                  </div>

                  <h3>{product.name}</h3>
                  <p style={styles.description}>{product.description}</p>

                  <div style={styles.cardFooter}>
                    <span style={styles.price}>${product.price}</span>
                    <span style={styles.stock}>Stock: {product.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside style={styles.orderBox}>
          <div style={styles.orderHeader}>
            <ShoppingCart size={26} />
            <h2>Create Order</h2>
          </div>

          <form onSubmit={submitOrder}>
            <label style={styles.label}>Customer Name</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Enter customer name"
              style={styles.input}
            />

            <label style={styles.label}>Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              style={styles.input}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={styles.input}
            />

            <button type="submit" style={styles.button}>
              Submit Order
            </button>
          </form>
        </aside>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
    padding: "40px",
    fontFamily: "Inter, Arial, sans-serif",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    gap: "20px",
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-block",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 12px",
    borderRadius: "999px",
    fontWeight: 600,
  },
  title: {
    fontSize: "48px",
    margin: "12px 0 8px",
  },
  subtitle: {
    color: "#475569",
    fontSize: "18px",
  },
  headerCard: {
    background: "white",
    padding: "20px",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    minWidth: "200px",
  },
  message: {
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: 600,
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "30px",
    alignItems: "start",
  },
  sectionTitle: {
    marginBottom: "18px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "white",
    padding: "22px",
    borderRadius: "20px",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e2e8f0",
  },
  cardIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#eff6ff",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  description: {
    color: "#64748b",
    lineHeight: 1.5,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
  },
  price: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#2563eb",
  },
  stock: {
    background: "#f1f5f9",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "14px",
  },
  orderBox: {
    background: "white",
    padding: "26px",
    borderRadius: "22px",
    boxShadow: "0 12px 35px rgba(15, 23, 42, 0.12)",
    border: "1px solid #e2e8f0",
    position: "sticky",
    top: "30px",
  },
  orderHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    marginTop: "16px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "24px",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "#2563eb",
    color: "white",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default App;