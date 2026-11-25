from pathlib import Path
from typing import List
import json
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent
MODEL_PATH = BASE / "model" / "demand_model.joblib"
METRICS_PATH = BASE / "model" / "metrics.json"

if not MODEL_PATH.exists():
    raise RuntimeError("Model not found. Run: python train_model.py")

model = joblib.load(MODEL_PATH)
metrics = json.loads(METRICS_PATH.read_text(encoding="utf-8"))

app = FastAPI(title="SmartCanteen ML API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionInput(BaseModel):
    item: str
    students_present: int = Field(ge=0)
    weather: str
    temperature: float
    exam_day: int = Field(ge=0, le=1)
    college_event: int = Field(ge=0, le=1)
    holiday: int = Field(ge=0, le=1)
    item_price: float = Field(gt=0)
    previous_day_sales: float = Field(ge=0)
    previous_week_sales: float = Field(ge=0)

@app.get("/")
def root():
    return {"message": "SmartCanteen ML API is running"}

@app.get("/health")
def health():
    return {"status": "ok", "model": metrics["selected_model"]}

@app.get("/metrics")
def get_metrics():
    return metrics

@app.get("/items")
def get_items():
    return {"items": ["Samosa", "Vada Pav", "Tea", "Coffee", "Sandwich", "Poha", "Maggi"]}

@app.post("/predict")
def predict(payload: PredictionInput):
    row = pd.DataFrame([payload.model_dump()])
    prediction = float(model.predict(row)[0])
    return {
        "item": payload.item,
        "predicted_demand": max(0, round(prediction)),
        "unit": "units"
    }

@app.post("/predict-bulk")
def predict_bulk(payloads: List[PredictionInput]):
    rows = pd.DataFrame([p.model_dump() for p in payloads])
    preds = model.predict(rows)
    return [
        {"item": p.item, "predicted_demand": max(0, round(float(pred)))}
        for p, pred in zip(payloads, preds)
    ]
