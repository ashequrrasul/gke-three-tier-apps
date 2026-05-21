import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

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

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        if (data.length > 0) {
          setProductId(data[0].id);
        }
      })
      .catch(() => {
        setMessage("Could not load products from Go backend.");
      });
  }, []);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();

    const order = {
      customerName,
      productId,
      quantity,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        throw new Error("Order failed");
      }

      const data = await response.json();
      setMessage(`Order created successfully. Order ID: ${data.id}`);
      setCustomerName("");
      setQuantity(1);
    } catch {
      setMessage("Order API failed. Check Go backend /api/orders endpoint.");
    }
  }

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>GKE Three Tier Frontend with istio!</h1>

      <h2>Products from Go Backend</h2>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ccc",
              padding: "15px",
              width: "250px",
              borderRadius: "8px",
            }}
          >
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>Price: ${product.price}</p>
            <p>Stock: {product.stock}</p>
          </div>
        ))}
      </div>

      <hr style={{ margin: "30px 0" }} />

      <h2>Create Order</h2>

      <form onSubmit={submitOrder}>
        <div style={{ marginBottom: "10px" }}>
          <label>Customer Name</label>
          <br />
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            style={{ padding: "8px", width: "300px" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Product</label>
          <br />
          <select
            value={productId}
            onChange={(e) => setProductId(Number(e.target.value))}
            style={{ padding: "8px", width: "320px" }}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Quantity</label>
          <br />
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{ padding: "8px", width: "300px" }}
          />
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>
          Submit Order
        </button>
      </form>
    </div>
  );
}

export default App;