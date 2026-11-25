# SmartCanteen – AI-Based College Canteen Demand Prediction and Inventory Management System

## Project Overview
SmartCanteen is a full-stack AI-powered system for predicting canteen food demand and managing sales and inventory. It helps the canteen staff plan food preparation more efficiently, reduce waste, and prevent stockouts during busy periods such as lunch hours, exam days, or college events.

The project combines:
- React + Vite for the frontend dashboard
- Node.js + Express for the backend API
- MongoDB Atlas for storing sales, inventory, and prediction history
- Python + FastAPI + Random Forest model for AI-based demand prediction

## Core Features
- Predict expected food demand for a selected item based on daily conditions
- Add and view historical sales data
- Add or update inventory stock
- Store prediction history and recommended preparation quantities
- Role-based access with admin and staff login
- Professional analytics dashboard with KPI cards and charts
- Simple and visually appealing SaaS-style interface

## System Architecture
React Frontend (5173) → Node.js/Express (5000) → MongoDB Atlas
Node.js also sends prediction requests → Python FastAPI (8000) → Random Forest Model

## Tech Stack
- Frontend: React, Vite, CSS
- Backend: Node.js, Express
- Database: MongoDB
- ML Service: Python, FastAPI, Scikit-learn, Random Forest

## Default Login Credentials
Admin
- Email: admin@smartcanteen
- Password: Admin@123

Staff
- Email: staff@smartcanteen
- Password: Staff@123

## Project Structure
```text
SmartCanteen/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
├── ml_service/
│   ├── app.py
│   ├── train_model.py
│   ├── requirements.txt
│   ├── data/
│   └── model/
├── README.md
└── MONGODB.txt
```

## How to Run
### 1. Create Python environment and start ML service
```powershell
cd ml_service
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python train_model.py
uvicorn app:app --reload --port 8000
```

### 2. Start the backend
```powershell
cd backend
npm install
npm start
```

### 3. Start the frontend
```powershell
cd frontend
npm install
npm run dev
```

### 4. Open the website
Visit:
```text
http://localhost:5173/
```

## Database Configuration
This project uses MongoDB Atlas in the backend configuration. Ensure your MongoDB connection is active before running the backend.

## Functional Modules
### Demand Prediction
The system predicts food demand for items such as Samosa, Vada Pav, Tea, Coffee, Sandwich, Poha, and Maggi. Inputs include:
- Food item
- Students present
- Weather condition
- Temperature
- Exam day status
- College event status
- Holiday status
- Item price
- Previous day sales
- Previous week sales

### Sales Management
- Add new sales records
- Store quantity and timestamp
- View sales history

### Inventory Management
- Add item stock
- Update current available quantity
- View inventory list

### Prediction History
- Save past prediction results
- Store recommended preparation quantities
- Show history in the dashboard

## ML Model Details
The Python service uses a trained Random Forest regressor, which is compared against other regression models during training. The Random Forest is selected because it gives strong predictive accuracy for this dataset.

## Viva / Presentation Points
Explain the project as a smart solution for real canteen operations:
- It reduces food waste.
- It avoids shortages during peak demand.
- It helps canteen staff make better preparation decisions.
- It combines AI, web development, and database management in one system.

## Future Enhancements
- Admin/staff login with JWT authentication
- Daily, weekly, and monthly sales charts
- Low-stock alert notifications
- Weather API integration
- Automatic model retraining
- Cloud deployment
- Mobile-responsive improvements

## Conclusion
SmartCanteen is a practical full-stack AI project that demonstrates real-world decision support for college canteen operations. It is suitable for a final-year project, academic demonstration, and viva presentation because it clearly shows end-to-end data flow from frontend input to model prediction and database storage.
