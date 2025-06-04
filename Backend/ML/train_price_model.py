import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
import joblib
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def load_and_clean_data():
    """Load data from database and clean it for model training."""
    try:
        # Create database connection
        DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        engine = create_engine(DATABASE_URL)

        # Adjusted query to handle separate article_couleur and article_taille tables
        query = """
        SELECT
            a.nom_produit,
            a.prix,
            c.libelle AS categorie,
            m.libelle AS marque,
            g.libelle AS genre,
            -- Aggregate distinct colors associated with the article
            STRING_AGG(DISTINCT cl.libelle, ',' ORDER BY cl.libelle) AS couleurs,
            -- Aggregate distinct sizes associated with the article
            STRING_AGG(DISTINCT t.libelle, ',' ORDER BY t.libelle) AS tailles,
            -- Sum quantities from article_taille (assuming quantity is tracked per size)
            SUM(at.quantite) AS quantite_totale
        FROM
            article a
        JOIN
            categorie c ON a.categorie_id = c.id
        JOIN
            marque m ON a.marque_id = m.id
        JOIN
            genre g ON a.genre_id = g.id
        LEFT JOIN
            article_couleur ac ON a.id = ac.article_id
        LEFT JOIN
            couleur cl ON ac.couleur_id = cl.id
        LEFT JOIN
            article_taille at ON a.id = at.article_id
        LEFT JOIN
            taille t ON at.taille_id = t.id
        GROUP BY
            a.id, a.nom_produit, a.prix, c.libelle, m.libelle, g.libelle
        HAVING
            SUM(at.quantite) IS NOT NULL -- Exclude articles with no quantity data
        ORDER BY
            a.id;
        """

        df = pd.read_sql(query, engine)

        # Data Cleaning and preparation
        # Fill missing values and ensure correct types
        df['tailles'] = df['tailles'].fillna('missing')
        df['couleurs'] = df['couleurs'].fillna('missing')

        for col in ["categorie", "marque", "genre"]:
            df[col] = df[col].str.strip().fillna("missing")

        # Convert quantite_totale to string for OneHotEncoder
        df['quantite_totale'] = df['quantite_totale'].fillna(0).astype(int).astype(str)

        return df

    except Exception as e:
        print(f"Error loading data: {e}")
        raise

def train_model():
    """Train and save the pricing model."""
    try:
        print("Loading and cleaning data...")
        df = load_and_clean_data()

        if df.empty:
            raise ValueError("No data loaded from database. Ensure your database tables contain data.")

        print(f"Loaded {len(df)} records for training.")

        # Features and target
        features = ["categorie", "marque", "genre", "couleurs", "tailles", "quantite_totale"]
        target = "prix"

        # Check if all features exist in the DataFrame
        if not all(f in df.columns for f in features):
            missing_features = [f for f in features if f not in df.columns]
            raise ValueError(f"Missing required features in DataFrame: {missing_features}. Please check your SQL query and data loading process.")

        # Define the preprocessor for categorical features
        preprocessor = ColumnTransformer(
            transformers=[
                ('onehot', OneHotEncoder(handle_unknown='ignore'), features)
            ],
            remainder='passthrough'
        )

        # Create the pipeline
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                n_jobs=-1))
        ])

        print("Training model...")
        pipeline.fit(df[features], df[target])

        # Save the trained model
        joblib.dump(pipeline, "price_predictor.pkl")
        print("✅ Model trained and saved successfully as price_predictor.pkl")

        # Optional: Print feature importance
        try:
            feature_names = pipeline.named_steps['preprocessor'].get_feature_names_out(features)
            importances = pipeline.named_steps['regressor'].feature_importances_
            feature_importances = pd.Series(importances, index=feature_names).sort_values(ascending=False)
            print("\nFeature Importances (Top 10):")
            print(feature_importances.head(10))
        except AttributeError:
            print("Could not extract feature importances (e.g., if regressor is not tree-based).")
        except Exception as e:
            print(f"Error getting feature names or importances: {e}")

    except ValueError as ve:
        print(f"Model training configuration error: {ve}")
    except Exception as e:
        print(f"An unexpected error occurred during model training: {e}")
        raise

if __name__ == '__main__':
    train_model()