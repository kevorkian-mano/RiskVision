from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

# Load the trained model and encoder (make sure .pkl files are in the same folder)
model = joblib.load('fraud_model.pkl')
encoder = joblib.load('country_encoder.pkl')

app = FastAPI()

# Define the expected input format
class TransactionInput(BaseModel):
    amount: float
    country: str
    hour: int

@app.post("/predict")
def predict(input: TransactionInput):
    try:
        print(f"🔍 ML API received: amount={input.amount}, country='{input.country}', hour={input.hour}")
        
        # Encode country
        country_code = encoder.transform([input.country])[0]
        print(f"📍 Country '{input.country}' encoded as: {country_code}")

        # Create input for model
        X = np.array([[input.amount, input.hour, country_code]])
        print(f"📊 Feature vector: {X}")
        
        # Get prediction
        prediction = model.predict(X)[0]
        print(f"🎯 Raw prediction: {prediction} (type: {type(prediction)})")
        
        result = {"isFraud": int(prediction)}
        print(f"✅ Returning: {result}")
        return result
        
    except ValueError as e:
        print(f"❌ ValueError: {e}")
        return {"error": f"Unknown country: {input.country}"}
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return {"error": f"Prediction error: {str(e)}"}
