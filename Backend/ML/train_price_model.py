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
    """Load data from database and clean it"""
    try:
        # Create database connection
        DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
        engine = create_engine(DATABASE_URL)
        
        query = """
        SELECT 
            c.libelle as categorie,
            m.libelle as marque,
            g.libelle as genre,
            string_agg(DISTINCT cl.libelle, ',') as couleurs,
            string_agg(DISTINCT t.libelle, ',') as tailles,
            SUM(at.quantite) as quantite_totale,
            a.prix
        FROM article a
        JOIN categorie c ON a.categorie_id = c.id
        JOIN marque m ON a.marque_id = m.id
        JOIN genre g ON a.genre_id = g.id
        LEFT JOIN article_couleur ac ON a.id = ac.article_id
        LEFT JOIN couleur cl ON ac.couleur_id = cl.id
        LEFT JOIN article_taille at ON a.id = at.article_id
        LEFT JOIN taille t ON at.taille_id = t.id
        GROUP BY a.id, c.libelle, m.libelle, g.libelle, a.prix
        """
        
        df = pd.read_sql(query, engine)
        
        # Clean data
        df['tailles'] = df['tailles'].str.replace(r'\s*,\s*', ',', regex=True)
        df['tailles'] = df['tailles'].fillna('missing')
        
        for col in ["categorie", "marque", "genre", "couleurs"]:
            df[col] = df[col].str.strip().fillna("missing")
        
        df['quantite_totale'] = df['quantite_totale'].fillna(1).astype(str)
        
        return df
        
    except Exception as e:
        print(f"Error loading data: {e}")
        raise

def train_model():
    """Train and save the pricing model"""
    try:
        print("Loading and cleaning data...")
        df = load_and_clean_data()
        
        if df.empty:
            raise ValueError("No data loaded from database")
        
        print(f"Loaded {len(df)} records")
        
        # Features and target
        features = ["categorie", "marque", "genre", "couleurs", "tailles", "quantite_totale"]
        target = "prix"
        
        # Build pipeline
        preprocessor = ColumnTransformer(
            transformers=[
                ('onehot', OneHotEncoder(handle_unknown='ignore'), features)
            ])
        
        pipeline = Pipeline([
            ('preprocessor', preprocessor),
            ('regressor', RandomForestRegressor(
                n_estimators=100,
                random_state=42,
                n_jobs=-1))  # Use all available cores
        ])
        
        print("Training model...")
        pipeline.fit(df[features], df[target])
        
        # Save model
        joblib.dump(pipeline, "price_predictor.pkl")
        print("✅ Model trained and saved successfully")
        
        # Print feature importance if available
        try:
            feature_names = pipeline.named_steps['preprocessor'].get_feature_names_out()
            print(f"Generated {len(feature_names)} features")
        except AttributeError:
            print("Could not extract feature names")
            
    except Exception as e:
        print(f"Error in model training: {e}")
        raise

if __name__ == '__main__':
    train_model()