from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

BASE = Path(__file__).resolve().parent
DATA = BASE / "data" / "canteen_sales.csv"
MODEL_DIR = BASE / "model"
MODEL_DIR.mkdir(exist_ok=True)

df = pd.read_csv(DATA)

target = "actual_sales"
features = [
    "item", "students_present", "weather", "temperature",
    "exam_day", "college_event", "holiday", "item_price",
    "previous_day_sales", "previous_week_sales"
]

X = df[features]
y = df[target]

categorical = ["item", "weather"]
numeric = [c for c in features if c not in categorical]

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
    ("num", "passthrough", numeric),
])

models = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(max_depth=10, random_state=42),
    "Random Forest": RandomForestRegressor(
        n_estimators=250, max_depth=14, random_state=42, n_jobs=-1
    ),
}

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42
)

results = {}
trained = {}

for name, estimator in models.items():
    pipe = Pipeline([("preprocessor", preprocessor), ("model", estimator)])
    pipe.fit(X_train, y_train)
    pred = pipe.predict(X_test)
    results[name] = {
        "mae": round(float(mean_absolute_error(y_test, pred)), 2),
        "rmse": round(float(mean_squared_error(y_test, pred) ** 0.5), 2),
        "r2": round(float(r2_score(y_test, pred)), 4),
    }
    trained[name] = pipe

best = trained["Random Forest"]
joblib.dump(best, MODEL_DIR / "demand_model.joblib")

with open(MODEL_DIR / "metrics.json", "w", encoding="utf-8") as f:
    json.dump({
        "target": target,
        "features": features,
        "rows": len(df),
        "test_rows": len(X_test),
        "models": results,
        "selected_model": "Random Forest"
    }, f, indent=2)

print("Training complete.")
print(json.dumps(results, indent=2))
