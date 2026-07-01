import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import time

def train_and_evaluate():
    print("Loading dataset...")
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "indian_accidents.csv")
    df = pd.read_csv(data_path)
    
    # Drop irrelevant columns
    # 'Accident_ID', 'Date', 'Time' might not be useful directly unless feature engineered, but we have Day_of_Week, Month, Year, Hour
    X = df.drop(columns=['Accident_ID', 'Date', 'Time', 'Severity', 'Casualties', 'Fatalities', 'Latitude', 'Longitude'])
    y = df['Severity']
    
    # Target Encoding
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    numerical_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    
    # Preprocessing for categorical data
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols)
        ])
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    
    # Define models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(random_state=42, n_estimators=100),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
    }
    
    best_model_name = ""
    best_f1 = -1
    best_pipeline = None
    
    results = []
    
    for name, model in models.items():
        print(f"Training {name}...")
        pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('classifier', model)])
        
        start_time = time.time()
        pipeline.fit(X_train, y_train)
        train_time = time.time() - start_time
        
        start_time = time.time()
        y_pred = pipeline.predict(X_test)
        pred_time = time.time() - start_time
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        results.append({
            "model_name": name,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "train_time": train_time,
            "prediction_time": pred_time
        })
        
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_pipeline = pipeline
            
    print(f"\nBest Model: {best_model_name} with F1-Score: {best_f1:.4f}")
    
    # Save the best model
    models_dir = os.path.join(os.path.dirname(__file__), "..", "models")
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(best_pipeline, os.path.join(models_dir, "best_model.pkl"))
    joblib.dump(label_encoder, os.path.join(models_dir, "label_encoder.pkl"))
    
    # Save metrics
    results_df = pd.DataFrame(results)
    results_df.to_csv(os.path.join(models_dir, "model_metrics.csv"), index=False)
    print("Model and metrics saved successfully.")

if __name__ == "__main__":
    train_and_evaluate()
