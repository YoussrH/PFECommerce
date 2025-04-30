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

pipeline = joblib.load("price_predictor.pkl")

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT')
    )

def fetch_mappings():
    conn = get_db_connection()
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
            
        return mappings
        
    except Exception as e:
        print(f"Error fetching mappings: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

DB_MAPPINGS = fetch_mappings()

@app.route('/predict', methods=['POST'])
def predict():
    try:
        global DB_MAPPINGS
        if not DB_MAPPINGS:
            DB_MAPPINGS = fetch_mappings()
            if not DB_MAPPINGS:
                return jsonify({"error": "Failed to load database mappings"}), 500

        data = request.json
        
        required_fields = ["categorie_id", "marque_id", "genre_id", "couleur_id", "tailles", "quantite_totale"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields", "required": required_fields}), 400

        try:
            input_data = {
                "categorie": DB_MAPPINGS['categories'].get(int(data["categorie_id"]), "inconnu"),
                "marque": DB_MAPPINGS['marques'].get(int(data["marque_id"]), "inconnu"),
                "genre": DB_MAPPINGS['genres'].get(int(data["genre_id"]), "inconnu"),
                "couleurs": DB_MAPPINGS['couleurs'].get(int(data["couleur_id"]), "inconnu"),
                "tailles": ",".join([
                    str(DB_MAPPINGS['tailles'].get(int(t), "inconnu"))
                    for t in data["tailles"]
                ]),
                "quantite_totale": str(data["quantite_totale"])
            }
        except (ValueError, KeyError) as e:
            return jsonify({"error": f"Invalid ID format: {str(e)}"}), 400

        df = pd.DataFrame([input_data])
        predicted_price = pipeline.predict(df)[0]
        
        return jsonify({
            "predicted_price": round(float(predicted_price), 2),
            "input_data": input_data 
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "message": "Prediction failed",
            "expected_format": {
                "categorie_id": "integer (e.g. 1)",
                "marque_id": "integer (e.g. 1)",
                "genre_id": "integer (e.g. 1)",
                "couleur_id": "integer (e.g. 1)",
                "tailles": "array of size IDs (e.g. [168,169])",
                "quantite_totale": "integer (e.g. 10)"
            }
        }), 400


@app.route('/refresh_mappings', methods=['POST'])
def refresh_mappings():
    global DB_MAPPINGS
    DB_MAPPINGS = fetch_mappings()
    if DB_MAPPINGS:
        return jsonify({"status": "success", "message": "Mappings refreshed"})
    else:
        return jsonify({"status": "error", "message": "Failed to refresh mappings"}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)