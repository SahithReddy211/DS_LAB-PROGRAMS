import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from datetime import timedelta

# Add the backend directory to the path so imports work correctly
sys.path.insert(0, os.path.dirname(__file__))

from extensions import db, jwt


def create_app():
    app = Flask(__name__)

    # ── Configuration ─────────────────────────────────────────────────────────
    app.config['SECRET_KEY'] = 'traffic_accident_secret_key_2024'
    app.config['JWT_SECRET_KEY'] = 'traffic_jwt_secret_key_2024'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS(app, origins='*', supports_credentials=True)

    # ── Extensions ────────────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)

    # ── Import models (needed so db.create_all knows about them) ──────────────
    with app.app_context():
        from utils.models import User, PredictionHistory  # noqa: F401
        db.create_all()

    # ── Register Blueprints ───────────────────────────────────────────────────
    from routes.auth import auth_bp
    from routes.predict import predict_bp
    from routes.dashboard import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(predict_bp, url_prefix='/api/ml')
    app.register_blueprint(dashboard_bp, url_prefix='/api/data')

    # ── Base routes ───────────────────────────────────────────────────────────
    @app.route('/')
    def index():
        return jsonify({"message": "Traffic Accident Analysis API is running", "status": "ok"})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "detail": str(e)}), 500

    return app


if __name__ == '__main__':
    application = create_app()
    application.run(debug=False, port=5000, host='0.0.0.0')
