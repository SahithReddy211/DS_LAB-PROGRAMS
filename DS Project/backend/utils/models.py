from extensions import db
from datetime import datetime
import json


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='User')  # 'User' or 'Admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class PredictionHistory(db.Model):
    __tablename__ = 'prediction_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    input_features = db.Column(db.Text, nullable=False)
    predicted_severity = db.Column(db.String(50), nullable=False)
    risk_score = db.Column(db.Float, nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "input_features": json.loads(self.input_features),
            "predicted_severity": self.predicted_severity,
            "risk_score": self.risk_score,
            "confidence": self.confidence,
            "timestamp": self.timestamp.isoformat()
        }
