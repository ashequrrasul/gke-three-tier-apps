package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	DB *pgxpool.Pool
}

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Stock       int     `json:"stock"`
}

type OrderRequest struct {
	CustomerName string `json:"customerName"`
	ProductID    int    `json:"productId"`
	Quantity     int    `json:"quantity"`
}

type OrderResponse struct {
	ID           int    `json:"id"`
	CustomerName string `json:"customerName"`
	ProductID    int    `json:"productId"`
	Quantity     int    `json:"quantity"`
	Status       string `json:"status"`
}

func main() {
	ctx := context.Background()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		filePath := os.Getenv("DATABASE_URL_FILE")

		if filePath != "" {
			data, err := os.ReadFile(filePath)
			if err == nil {
				databaseURL = strings.TrimSpace(string(data))
			}
		}
	}
	if databaseURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("Unable to create database pool: %v", err)
	}
	defer db.Close()

	err = db.Ping(ctx)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}

	app := &App{DB: db}

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", app.healthHandler)
	mux.HandleFunc("/api/ready", app.readyHandler)
	mux.HandleFunc("/api/products", app.productsHandler)
	mux.HandleFunc("/api/orders", app.ordersHandler)

	log.Printf("Backend API running on port %s", port)

	err = http.ListenAndServe(":"+port, corsMiddleware(loggingMiddleware(mux)))
	if err != nil {
		log.Fatal(err)
	}
}

func (app *App) healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "gcp-three-tier-backend",
		"version": "v1",
	})
}

func (app *App) readyHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	err := app.DB.Ping(ctx)
	if err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "not ready",
			"error":  "database unavailable",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ready",
	})
}

func (app *App) productsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	rows, err := app.DB.Query(
		r.Context(),
		`SELECT id, name, description, price, stock FROM products ORDER BY id`,
	)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to read products"})
		return
	}
	defer rows.Close()

	products := []Product{}

	for rows.Next() {
		var product Product

		err := rows.Scan(
			&product.ID,
			&product.Name,
			&product.Description,
			&product.Price,
			&product.Stock,
		)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to scan product"})
			return
		}

		products = append(products, product)
	}

	writeJSON(w, http.StatusOK, products)
}

func (app *App) ordersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	var order OrderRequest

	err := json.NewDecoder(r.Body).Decode(&order)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if order.CustomerName == "" || order.ProductID == 0 || order.Quantity <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "customerName, productId, and quantity are required",
		})
		return
	}

	var response OrderResponse

	err = app.DB.QueryRow(
		r.Context(),
		`
		INSERT INTO orders (customer_name, product_id, quantity, status)
		VALUES ($1, $2, $3, 'created')
		RETURNING id, customer_name, product_id, quantity, status
		`,
		order.CustomerName,
		order.ProductID,
		order.Quantity,
	).Scan(
		&response.ID,
		&response.CustomerName,
		&response.ProductID,
		&response.Quantity,
		&response.Status,
	)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create order"})
		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func writeJSON(w http.ResponseWriter, statusCode int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}