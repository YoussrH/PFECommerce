from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Load the trained pipeline
try:
    pipeline = joblib.load("price_predictor.pkl")
except FileNotFoundError:
    print("Error: price_predictor.pkl not found. Please train the model first.")
    pipeline = None

def get_db_connection():
    """Establishes and returns a database connection."""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT')
        )
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

def fetch_mappings():
    """Fetches category, brand, genre, color, and size mappings from the database."""
    conn = get_db_connection()
    if not conn:
        return None

    cursor = conn.cursor()
    mappings = {
        'categories': {},
        'marques': {},
        'genres': {},
        'couleurs': {},
        'tailles': {}
    }

    try:
        cursor.execute("SELECT id, libelle FROM categorie")
        for id, libelle in cursor.fetchall():
            mappings['categories'][id] = libelle

        cursor.execute("SELECT id, libelle FROM marque")
        for id, libelle in cursor.fetchall():
            mappings['marques'][id] = libelle

        cursor.execute("SELECT id, libelle FROM genre")
        for id, libelle in cursor.fetchall():
            mappings['genres'][id] = libelle

        cursor.execute("SELECT id, libelle FROM couleur")
        for id, libelle in cursor.fetchall():
            mappings['couleurs'][id] = libelle

        cursor.execute("SELECT id, libelle FROM taille")
        for id, libelle in cursor.fetchall():
            mappings['tailles'][id] = libelle

        print("Mappings fetched successfully.")
        return mappings

    except Exception as e:
        print(f"Error fetching mappings: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

# Initialize DB_MAPPINGS when the app starts
DB_MAPPINGS = fetch_mappings()

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predicts the price of an article based on its attributes.
    Expects a JSON payload with 'categorie_id', 'marque_id', 'genre_id',
    and 'variations' (list of {'taille_id', 'couleur_id', 'quantite'}).
    """
    if pipeline is None:
        return jsonify({"error": "Model not loaded. Please ensure the model is trained and 'price_predictor.pkl' exists."}), 500

    global DB_MAPPINGS
    if not DB_MAPPINGS:
        DB_MAPPINGS = fetch_mappings()
        if not DB_MAPPINGS:
            return jsonify({"error": "Failed to load database mappings"}), 500

    data = request.json
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    required_fields = ["categorie_id", "marque_id", "genre_id", "variations"]
    if not all(field in data for field in required_fields):
        return jsonify({
            "error": "Missing required fields",
            "required": required_fields,
            "expected_format": {
                "categorie_id": "integer (e.g., 1)",
                "marque_id": "integer (e.g., 1)",
                "genre_id": "integer (e.g., 1)",
                "variations": [
                    {"taille_id": "integer (e.g., 370)", "couleur_id": "integer (e.g., 12)", "quantite": "integer (e.g., 4)"}
                ]
            }
        }), 400

    try:
        # Extract and map main article attributes
        categorie = DB_MAPPINGS['categories'].get(int(data["categorie_id"]), "inconnu")
        marque = DB_MAPPINGS['marques'].get(int(data["marque_id"]), "inconnu")
        genre = DB_MAPPINGS['genres'].get(int(data["genre_id"]), "inconnu")

        all_tailles_libelles = set() # Use a set to store unique libelles
        all_couleurs_libelles = set() # Use a set to store unique libelles
        total_quantity = 0

        # Process variations to gather all sizes, colors, and total quantity
        if not isinstance(data["variations"], list) or not data["variations"]:
            return jsonify({"error": "Variations must be a non-empty list of objects."}), 400

        for variation in data["variations"]:
            if not all(k in variation for k in ["taille_id", "couleur_id", "quantite"]):
                return jsonify({"error": "Each variation must contain 'taille_id', 'couleur_id', and 'quantite'."}), 400

            taille_id = int(variation["taille_id"])
            couleur_id = int(variation["couleur_id"])
            quantity = int(variation["quantite"])

            taille_libelle = DB_MAPPINGS['tailles'].get(taille_id, "inconnu")
            couleur_libelle = DB_MAPPINGS['couleurs'].get(couleur_id, "inconnu")

            if taille_libelle == "inconnu":
                 print(f"Warning: Unknown Taille ID: {taille_id}")
            if couleur_libelle == "inconnu":
                 print(f"Warning: Unknown Couleur ID: {couleur_id}")

            all_tailles_libelles.add(taille_libelle) # Add libelle to the set
            all_couleurs_libelles.add(couleur_libelle) # Add libelle to the set
            total_quantity += quantity

        # Create input for the model
        input_data = {
            "categorie": categorie,
            "marque": marque,
            "genre": genre,
            "couleurs": ",".join(sorted(list(all_couleurs_libelles))), # Join unique and sorted colors
            "tailles": ",".join(sorted(list(all_tailles_libelles))),   # Join unique and sorted sizes
            "quantite_totale": str(total_quantity)
        }

        df = pd.DataFrame([input_data])
        predicted_price = pipeline.predict(df)[0]

        return jsonify({
            "predicted_price": round(float(predicted_price), 2),
            "input_data": input_data
        })

    except (ValueError, KeyError, TypeError) as e:
        return jsonify({"error": f"Invalid input data format: {str(e)}. Please check your IDs and data types."}), 400
    except Exception as e:
        print(f"An unexpected error occurred during prediction: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": "Prediction failed due to an unexpected error.",
            "details": str(e)
        }), 500

@app.route('/refresh_mappings', methods=['POST'])
def refresh_mappings():
    """Refreshes the database mappings."""
    global DB_MAPPINGS
    DB_MAPPINGS = fetch_mappings()
    if DB_MAPPINGS:
        return jsonify({"status": "success", "message": "Mappings refreshed successfully."})
    else:
        return jsonify({"status": "error", "message": "Failed to refresh mappings. Check database connection."}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)