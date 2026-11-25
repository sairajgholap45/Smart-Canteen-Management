const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

const USERS = {
  admin: {
    username: "admin@smartcanteen",
    password: "Admin@123",
    role: "admin",
    name: "Admin User"
  },
  staff: {
    username: "staff@smartcanteen",
    password: "Staff@123",
    role: "staff",
    name: "Canteen Staff"
  }
};

mongoose.connect("mongodb+srv://sairajgholap45_db_user:sairaj8988@cluster0.cgjmsdr.mongodb.net/smartcanteen?retryWrites=true&w=majority")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err.message));

const Sale = mongoose.model("Sale", new mongoose.Schema({
  item: String, quantity: Number, date: {type: Date, default: Date.now}
}));

const Inventory = mongoose.model("Inventory", new mongoose.Schema({
  item: {type: String, unique: true}, quantity: Number
}));

const Prediction = mongoose.model("Prediction", new mongoose.Schema({
  item: String, predictedDemand: Number, recommendedPreparation: Number,
  date: {type: Date, default: Date.now}
}));

app.get("/", (req,res) => res.json({message:"SmartCanteen backend is running"}));

app.post("/api/auth/login", (req,res) => {
  const { username, password } = req.body || {};
  const user = Object.values(USERS).find(entry =>
    entry.username.toLowerCase() === String(username || "").toLowerCase() &&
    entry.password === String(password || "")
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password." });
  }

  return res.json({
    token: `${user.role}-token-${Date.now()}`,
    user: {
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

app.get("/api/sales", async (req,res) => res.json(await Sale.find().sort({date:-1})));
app.post("/api/sales", async (req,res) => res.status(201).json(await Sale.create(req.body)));

app.get("/api/inventory", async (req,res) => res.json(await Inventory.find().sort({item:1})));
app.post("/api/inventory", async (req,res) => {
  const row = await Inventory.findOneAndUpdate(
    {item:req.body.item}, {item:req.body.item, quantity:req.body.quantity},
    {new:true, upsert:true}
  );
  res.json(row);
});

app.get("/api/predictions", async (req,res) => res.json(await Prediction.find().sort({date:-1})));
app.post("/api/predictions", async (req,res) => {
  try {
    const r = await fetch("http://127.0.0.1:8000/predict", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify(req.body)
    });
    const data = await r.json();
    const saved = await Prediction.create({
      item:data.item,
      predictedDemand:data.predicted_demand,
      recommendedPreparation:Math.ceil(data.predicted_demand * 1.05)
    });
    res.json(saved);
  } catch(e) {
    res.status(500).json({message:"Python ML server is not running. Start FastAPI first."});
  }
});

app.get("/api/summary", async (req,res) => {
  const [sales, inventory, predictions] = await Promise.all([
    Sale.find().sort({date:-1}),
    Inventory.find().sort({item:1}),
    Prediction.find().sort({date:-1})
  ]);

  const totalInventory = inventory.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalSales = sales.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const avgPrediction = predictions.length
    ? Math.round(predictions.reduce((sum, row) => sum + Number(row.predictedDemand || 0), 0) / predictions.length)
    : 0;

  const itemSales = sales.reduce((map, row) => {
    map[row.item] = (map[row.item] || 0) + Number(row.quantity || 0);
    return map;
  }, {});

  const topItem = Object.entries(itemSales).sort((a,b) => b[1] - a[1])[0];

  res.json({
    totalInventory,
    totalSales,
    avgPrediction,
    topItem: topItem ? topItem[0] : "-",
    stockAlerts: inventory.filter(item => Number(item.quantity || 0) < 30).length,
    predictionCount: predictions.length
  });
});

app.listen(5000, () => console.log("Backend: http://localhost:5000"));
