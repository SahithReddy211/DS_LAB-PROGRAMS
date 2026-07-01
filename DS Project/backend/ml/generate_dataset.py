import pandas as pd
import numpy as np
from datetime import timedelta, datetime
import random
import os

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

NUM_RECORDS = 25000

# Define domains
states = {
    "Maharashtra": {"cities": ["Mumbai", "Pune", "Nagpur"], "lat_range": (18.5, 19.5), "lon_range": (72.8, 79.1)},
    "Karnataka": {"cities": ["Bengaluru", "Mysuru", "Hubli"], "lat_range": (12.3, 15.3), "lon_range": (75.1, 77.6)},
    "Tamil Nadu": {"cities": ["Chennai", "Coimbatore", "Madurai"], "lat_range": (9.9, 13.1), "lon_range": (77.5, 80.3)},
    "Delhi": {"cities": ["New Delhi", "North Delhi", "South Delhi"], "lat_range": (28.5, 28.8), "lon_range": (76.9, 77.3)},
    "Telangana": {"cities": ["Hyderabad", "Warangal", "Nizamabad"], "lat_range": (17.3, 18.7), "lon_range": (78.1, 79.5)}
}

road_types = ["National Highway", "State Highway", "City Road", "Rural Road"]
road_categories = ["Single Lane", "Double Lane", "Four Lane", "Six Lane"]
junction_types = ["Intersection", "Roundabout", "T-Junction", "Y-Junction", "No Junction"]
weather_conditions = ["Clear", "Rainy", "Foggy", "Cloudy", "Dust Storm"]
light_conditions = ["Daylight", "Night - Street Lights On", "Night - No Street Lights", "Twilight"]
road_surface = ["Dry", "Wet", "Potholed", "Muddy"]
traffic_control = ["Traffic Signal", "Stop Sign", "Police Controlled", "None"]
vehicle_types = ["Two-Wheeler", "Car", "Bus", "Truck", "Auto Rickshaw", "Tractor"]
genders = ["Male", "Female", "Unknown"]

data = []

start_date = datetime(2021, 1, 1)
end_date = datetime(2023, 12, 31)
time_between_dates = end_date - start_date
days_between_dates = time_between_dates.days

for i in range(NUM_RECORDS):
    # Time Features
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + timedelta(days=random_number_of_days)
    hour_p = [0.02, 0.01, 0.01, 0.01, 0.02, 0.03, 0.05, 0.06, 0.08, 0.07, 0.06, 0.05, 0.05, 0.05, 0.06, 0.07, 0.08, 0.07, 0.06, 0.04, 0.03, 0.03, 0.02, 0.02]
    hour = np.random.choice(range(24), p=np.array(hour_p)/sum(hour_p))
    minute = random.randint(0, 59)
    dt = datetime(random_date.year, random_date.month, random_date.day, hour, minute)
    
    date_str = dt.strftime("%Y-%m-%d")
    time_str = dt.strftime("%H:%M:%S")
    day_of_week = dt.strftime("%A")
    month = dt.month
    year = dt.year
    
    # Location
    state = np.random.choice(list(states.keys()))
    city = np.random.choice(states[state]["cities"])
    district = city + " District"
    lat = round(random.uniform(states[state]["lat_range"][0], states[state]["lat_range"][1]), 4)
    lon = round(random.uniform(states[state]["lon_range"][0], states[state]["lon_range"][1]), 4)
    
    urban_rural = "Urban" if "City" in road_types or state == "Delhi" else np.random.choice(["Urban", "Rural"], p=[0.6, 0.4])
    
    # Environmental & Road
    weather = np.random.choice(weather_conditions, p=[0.6, 0.2, 0.1, 0.08, 0.02])
    surface = "Wet" if weather == "Rainy" else np.random.choice(road_surface, p=[0.7, 0.05, 0.2, 0.05])
    
    if 6 <= hour <= 18:
        light = "Daylight"
    elif 18 < hour < 19 or 5 < hour < 6:
        light = "Twilight"
    else:
        light = np.random.choice(["Night - Street Lights On", "Night - No Street Lights"], p=[0.7, 0.3])
        
    road_type = np.random.choice(road_types, p=[0.2, 0.3, 0.4, 0.1])
    road_cat = np.random.choice(road_categories)
    junc = np.random.choice(junction_types)
    traf_ctrl = np.random.choice(traffic_control)
    
    # Driver & Vehicle
    vehicle = np.random.choice(vehicle_types, p=[0.4, 0.3, 0.05, 0.15, 0.08, 0.02])
    num_vehicles = np.random.choice([1, 2, 3, 4], p=[0.4, 0.5, 0.08, 0.02])
    age = int(np.random.normal(35, 12))
    age = max(18, min(age, 80))
    gender = np.random.choice(genders, p=[0.8, 0.15, 0.05])
    alcohol = 1 if np.random.random() < 0.1 else 0
    if time_str > "22:00:00" or time_str < "04:00:00":
        alcohol = 1 if np.random.random() < 0.3 else 0
        
    # Speed estimation
    base_speed = 40
    if road_type == "National Highway": base_speed = 80
    elif road_type == "State Highway": base_speed = 60
    
    if weather in ["Rainy", "Foggy"]: base_speed *= 0.8
    speed = int(np.random.normal(base_speed, 15))
    speed = max(10, min(speed, 140))
    
    if alcohol == 1: speed += 15 # Drink and drive tends to overspeed
    
    # Target Variables Generation based on logical rules
    risk_factor = 0
    if alcohol == 1: risk_factor += 3
    if speed > 80: risk_factor += 2
    if speed > 100: risk_factor += 2
    if weather == "Rainy" or weather == "Foggy": risk_factor += 1
    if light == "Night - No Street Lights": risk_factor += 1.5
    if vehicle == "Two-Wheeler": risk_factor += 1
    if surface == "Potholed": risk_factor += 1
    
    if risk_factor >= 6:
        severity = "Fatal"
        fatalities = np.random.randint(1, 4)
        casualties = fatalities + np.random.randint(0, 3)
    elif risk_factor >= 3.5:
        severity = "Severe"
        fatalities = 0
        casualties = np.random.randint(1, 5)
    elif risk_factor >= 1.5:
        severity = "Moderate"
        fatalities = 0
        casualties = np.random.randint(0, 2)
    else:
        severity = "Minor"
        fatalities = 0
        casualties = 0

    data.append([
        f"ACC_{i:06d}", date_str, time_str, state, district, city, lat, lon,
        road_type, road_cat, junc, weather, light, surface, traf_ctrl,
        vehicle, num_vehicles, age, gender, speed, alcohol,
        casualties, fatalities, severity, urban_rural, day_of_week, month, year
    ])

columns = [
    "Accident_ID", "Date", "Time", "State", "District", "City", "Latitude", "Longitude",
    "Road_Type", "Road_Category", "Junction_Type", "Weather_Condition", "Light_Condition", "Road_Surface_Condition", "Traffic_Control",
    "Vehicle_Type", "Number_of_Vehicles", "Driver_Age", "Driver_Gender", "Speed", "Alcohol_Involvement",
    "Casualties", "Fatalities", "Severity", "Urban_Rural", "Day_of_Week", "Month", "Year"
]

df = pd.DataFrame(data, columns=columns)
# Save to data directory
data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(data_dir, exist_ok=True)
df.to_csv(os.path.join(data_dir, "indian_accidents.csv"), index=False)
print(f"Generated {NUM_RECORDS} accident records successfully. Saved to data/indian_accidents.csv")
