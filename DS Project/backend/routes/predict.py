from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from utils.models import PredictionHistory
import joblib
import pandas as pd
import numpy as np
import json
import os

predict_bp = Blueprint('predict', __name__)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'best_model.pkl')
LE_PATH = os.path.join(BASE_DIR, 'models', 'label_encoder.pkl')

_model = None
_le = None


def load_model():
    global _model, _le
    if _model is None and os.path.exists(MODEL_PATH):
        _model = joblib.load(MODEL_PATH)
    if _le is None and os.path.exists(LE_PATH):
        _le = joblib.load(LE_PATH)
    return _model, _le


def compute_risk_score(proba, classes):
    """Weighted expected severity index mapped to 0-100."""
    mapping = {"Minor": 0, "Moderate": 1, "Severe": 2, "Fatal": 3}
    score = sum(mapping.get(classes[i], 0) * proba[i] for i in range(len(classes)))
    return float(round((score / 3.0) * 100, 2))


def get_shap_explanation(model, df):
    """Return top-5 feature impacts using SHAP TreeExplainer."""
    try:
        import shap
        preprocessor = model.named_steps['preprocessor']
        clf = model.named_steps['classifier']

        X_transformed = preprocessor.transform(df)

        # Build feature names
        num_cols = preprocessor.transformers_[0][2]
        cat_encoder = preprocessor.transformers_[1][1]
        cat_cols = preprocessor.transformers_[1][2]
        cat_names = list(cat_encoder.get_feature_names_out(cat_cols))
        feature_names = list(num_cols) + cat_names

        explainer = shap.TreeExplainer(clf)
        shap_values = explainer.shap_values(X_transformed)

        pred_class = int(clf.predict(X_transformed)[0])

        if isinstance(shap_values, list):
            vals = shap_values[pred_class][0]
        elif len(np.array(shap_values).shape) == 3:
            vals = np.array(shap_values)[0, :, pred_class]
        else:
            vals = shap_values[0]

        pairs = sorted(zip(feature_names, vals), key=lambda x: abs(x[1]), reverse=True)[:5]
        return [{"feature": f, "impact": float(v)} for f, v in pairs]

    except Exception as e:
        # Fallback: use feature importances from the classifier
        try:
            preprocessor = model.named_steps['preprocessor']
            clf = model.named_steps['classifier']
            num_cols = list(preprocessor.transformers_[0][2])
            cat_encoder = preprocessor.transformers_[1][1]
            cat_cols = preprocessor.transformers_[1][2]
            cat_names = list(cat_encoder.get_feature_names_out(cat_cols))
            feature_names = num_cols + cat_names
            importances = clf.feature_importances_
            pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:5]
            return [{"feature": f, "impact": float(v)} for f, v in pairs]
        except Exception:
            return []


# Expected columns from the training pipeline (must match generate_dataset.py)
EXPECTED_COLS = [
    'State', 'District', 'City',
    'Road_Type', 'Road_Category', 'Junction_Type',
    'Weather_Condition', 'Light_Condition', 'Road_Surface_Condition', 'Traffic_Control',
    'Vehicle_Type', 'Number_of_Vehicles',
    'Driver_Age', 'Driver_Gender', 'Speed', 'Alcohol_Involvement',
    'Urban_Rural', 'Day_of_Week', 'Month', 'Year'
]


@predict_bp.route('/predict', methods=['POST'])
@jwt_required(optional=True)
def predict_accident():
    try:
        data = request.get_json(force=True, silent=True) or {}
        model, le = load_model()

        if model is None or le is None:
            return jsonify({"error": "Model not found. Please train the model first."}), 400

        # Build input dataframe
        row = {}
        for col in EXPECTED_COLS:
            val = data.get(col)
            if val is None:
                # Apply sensible defaults
                defaults = {
                    'State': 'Maharashtra', 'District': 'Mumbai District', 'City': 'Mumbai',
                    'Road_Type': 'City Road', 'Road_Category': 'Four Lane',
                    'Junction_Type': 'Intersection', 'Weather_Condition': 'Clear',
                    'Light_Condition': 'Daylight', 'Road_Surface_Condition': 'Dry',
                    'Traffic_Control': 'Traffic Signal', 'Vehicle_Type': 'Car',
                    'Number_of_Vehicles': 2, 'Driver_Age': 35, 'Driver_Gender': 'Male',
                    'Speed': 60, 'Alcohol_Involvement': 0,
                    'Urban_Rural': 'Urban', 'Day_of_Week': 'Monday',
                    'Month': 6, 'Year': 2024
                }
                row[col] = defaults.get(col, 0)
            else:
                row[col] = val

        # Ensure numeric types
        for num_col in ['Number_of_Vehicles', 'Driver_Age', 'Speed', 'Alcohol_Involvement', 'Month', 'Year']:
            try:
                row[num_col] = int(row[num_col])
            except (ValueError, TypeError):
                row[num_col] = 0

        input_df = pd.DataFrame([row])

        # Predict
        pred_encoded = model.predict(input_df)
        pred_proba = model.predict_proba(input_df)[0]
        predicted_severity = le.inverse_transform(pred_encoded)[0]
        confidence = float(max(pred_proba)) * 100
        risk_score = compute_risk_score(pred_proba, le.classes_)

        # SHAP
        top_factors = get_shap_explanation(model, input_df)

        # Safety measures
        measures = ["Always wear a seatbelt / helmet.", "Drive within the posted speed limit."]
        if int(row.get('Alcohol_Involvement', 0)) == 1:
            measures.insert(0, "⚠️ NEVER drink and drive. This drastically increases fatal risk.")
        if row.get('Weather_Condition') in ['Rainy', 'Foggy']:
            measures.append("Reduce speed in poor weather. Maintain safe following distance.")
        if predicted_severity in ['Severe', 'Fatal']:
            measures.append("🚨 Extreme caution advised — this scenario is HIGH RISK.")

        # Save to history if user is logged in
        current_user_id = get_jwt_identity()
        if current_user_id:
            try:
                entry = PredictionHistory(
                    user_id=int(current_user_id),
                    input_features=json.dumps(data),
                    predicted_severity=predicted_severity,
                    risk_score=risk_score,
                    confidence=confidence
                )
                db.session.add(entry)
                db.session.commit()
            except Exception:
                db.session.rollback()

        return jsonify({
            "predicted_severity": predicted_severity,
            "confidence": round(confidence, 2),
            "risk_score": risk_score,
            "top_factors": top_factors,
            "safety_measures": measures
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@predict_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        current_user_id = get_jwt_identity()
        records = (PredictionHistory.query
                   .filter_by(user_id=int(current_user_id))
                   .order_by(PredictionHistory.timestamp.desc())
                   .all())
        return jsonify([r.to_dict() for r in records]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@predict_bp.route('/history/<int:record_id>', methods=['DELETE'])
@jwt_required()
def delete_history(record_id):
    try:
        current_user_id = get_jwt_identity()
        entry = PredictionHistory.query.filter_by(id=record_id, user_id=int(current_user_id)).first()
        if not entry:
            return jsonify({"error": "Record not found"}), 404
        db.session.delete(entry)
        db.session.commit()
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
