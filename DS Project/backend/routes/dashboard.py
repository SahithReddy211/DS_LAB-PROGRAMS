from flask import Blueprint, jsonify, request
import pandas as pd
import os

dashboard_bp = Blueprint('dashboard', __name__)

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'indian_accidents.csv')

_df = None


def get_df():
    global _df
    if _df is None:
        if not os.path.exists(DATA_PATH):
            return None
        _df = pd.read_csv(DATA_PATH)
    return _df


@dashboard_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        df = get_df()
        if df is None:
            return jsonify({"error": "Dataset not found. Please generate the dataset first."}), 404

        total_accidents = len(df)
        fatal_accidents = int((df['Severity'] == 'Fatal').sum())
        avg_speed = round(float(df['Speed'].mean()), 1) if 'Speed' in df.columns else 0
        total_casualties = int(df['Casualties'].sum()) if 'Casualties' in df.columns else 0

        month_trend = (df.groupby('Month').size()
                         .reset_index(name='count')
                         .to_dict('records'))

        severity_dist = (df['Severity'].value_counts()
                           .reset_index()
                           .rename(columns={'Severity': 'name', 'count': 'value'})
                           .to_dict('records'))

        state_dist = (df['State'].value_counts()
                        .head(10)
                        .reset_index()
                        .rename(columns={'State': 'name', 'count': 'value'})
                        .to_dict('records'))

        weather_dist = (df['Weather_Condition'].value_counts()
                          .reset_index()
                          .rename(columns={'Weather_Condition': 'name', 'count': 'value'})
                          .to_dict('records'))

        vehicle_dist = (df['Vehicle_Type'].value_counts()
                          .reset_index()
                          .rename(columns={'Vehicle_Type': 'name', 'count': 'value'})
                          .to_dict('records'))

        return jsonify({
            "total_accidents": total_accidents,
            "fatal_accidents": fatal_accidents,
            "avg_speed": avg_speed,
            "total_casualties": total_casualties,
            "month_trend": month_trend,
            "severity_dist": severity_dist,
            "state_dist": state_dist,
            "weather_dist": weather_dist,
            "vehicle_dist": vehicle_dist
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route('/map', methods=['GET'])
def get_map_data():
    try:
        df = get_df()
        if df is None:
            return jsonify({"error": "Dataset not found"}), 404

        sample = df.sample(n=min(800, len(df)), random_state=42)
        cols = ['Latitude', 'Longitude', 'Severity', 'State', 'City', 'Weather_Condition', 'Speed']
        available = [c for c in cols if c in sample.columns]
        records = sample[available].dropna(subset=['Latitude', 'Longitude']).to_dict('records')
        return jsonify(records), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@dashboard_bp.route('/filter_options', methods=['GET'])
def get_filter_options():
    try:
        df = get_df()
        if df is None:
            return jsonify({"error": "Dataset not found"}), 404

        options = {}
        for col in ['State', 'Severity', 'Weather_Condition', 'Road_Type', 'Vehicle_Type', 'City']:
            if col in df.columns:
                options[col] = sorted(df[col].dropna().unique().tolist())

        return jsonify(options), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
