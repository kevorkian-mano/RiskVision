import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import json

def create_balanced_dataset():
    """Create a balanced dataset with both legitimate and fraudulent transactions"""
    print("Creating balanced dataset...")
    
    # Legitimate transactions (isFraud = 0)
    legitimate_data = []
    legitimate_countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France']
    
    for _ in range(300):
        legitimate_data.append({
            'amount': np.random.uniform(10, 5000),
            'country': np.random.choice(legitimate_countries),
            'hour': np.random.randint(6, 22),
            'isFraud': 0
        })
    
    # Fraudulent transactions (isFraud = 1)
    fraud_data = []
    fraud_countries = ['Nigeria', 'Russia', 'Iran', 'Syria', 'North Korea']
    
    for _ in range(300):
        fraud_data.append({
            'amount': np.random.uniform(10000, 100000),
            'country': np.random.choice(fraud_countries),
            'hour': np.random.choice([0, 1, 2, 3, 4, 5, 22, 23]),
            'isFraud': 1
        })
    
    return legitimate_data + fraud_data

def train_model():
    """Train the fraud detection model"""
    print("Training fraud detection model...")
    
    # Create balanced dataset
    data = create_balanced_dataset()
    df = pd.DataFrame(data)
    
    # Encode countries
    country_encoder = LabelEncoder()
    df['country_encoded'] = country_encoder.fit_transform(df['country'])
    
    # Prepare features
    X = df[['amount', 'hour', 'country_encoded']].values
    y = df['isFraud'].values
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X, y)
    
    # Test predictions
    print("\nTesting model predictions:")
    test_cases = [
        {'amount': 25, 'country': 'United States', 'hour': 14},
        {'amount': 50000, 'country': 'Iran', 'hour': 2},
        {'amount': 100, 'country': 'Canada', 'hour': 10}
    ]
    
    for case in test_cases:
        country_code = country_encoder.transform([case['country']])[0]
        features = np.array([[case['amount'], case['hour'], country_code]])
        prediction = model.predict(features)[0]
        result = "Fraudulent" if prediction == 1 else "Legitimate"
        print(f"${case['amount']} from {case['country']} at {case['hour']}:00 → {result}")
    
    # Save model and encoder
    joblib.dump(model, 'fraud_model.pkl')
    joblib.dump(country_encoder, 'country_encoder.pkl')
    print("\nModel saved successfully!")

if __name__ == "__main__":
    train_model()
