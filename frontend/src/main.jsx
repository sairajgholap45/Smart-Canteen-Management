import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import axios from "axios";
import "./style.css";

const API="http://localhost:5000/api";
const ITEMS=["Samosa","Vada Pav","Tea","Coffee","Sandwich","Poha","Maggi"];

const initial={
 item:"Samosa", students_present:800, weather:"Sunny", temperature:28,
 exam_day:0, college_event:0, holiday:0, item_price:15,
 previous_day_sales:140, previous_week_sales:135
};

function App(){
 const [tab,setTab]=useState("dashboard");
 const [form,setForm]=useState(initial);
 const [result,setResult]=useState(null);
 const [sales,setSales]=useState([]);
 const [inventory,setInventory]=useState([]);
 const [predictions,setPredictions]=useState([]);
 const [sale,setSale]=useState({item:"Samosa",quantity:10});
 const [stock,setStock]=useState({item:"Samosa",quantity:100});
 const [message,setMessage]=useState("");
 const [user,setUser]=useState(() => {
   try {
     return JSON.parse(localStorage.getItem("smartcanteen-user")) || null;
   } catch {
     return null;
   }
 });

 const load=()=>{
   axios.get(API+"/sales").then(r=>setSales(r.data)).catch(()=>{});
   axios.get(API+"/inventory").then(r=>setInventory(r.data)).catch(()=>{});
   axios.get(API+"/predictions").then(r=>setPredictions(r.data)).catch(()=>{});
 };
 useEffect(load,[]);

 const stats = useMemo(() => {
   const totalStock = inventory.reduce((sum,row)=>sum + Number(row.quantity || 0),0);
   const totalSales = sales.reduce((sum,row)=>sum + Number(row.quantity || 0),0);
   const avgPrediction = predictions.length
     ? Math.round(predictions.reduce((sum,row)=>sum + Number(row.predictedDemand || 0),0) / predictions.length)
     : 0;
   const topSelling = Object.entries(sales.reduce((acc,row)=>{acc[row.item]=(acc[row.item]||0)+Number(row.quantity||0); return acc;},{})).sort((a,b)=>b[1]-a[1])[0];
   const lowStock = inventory.filter(row => Number(row.quantity || 0) < 30).length;
   return { totalStock, totalSales, avgPrediction, topItem: topSelling ? topSelling[0] : "-", lowStock };
 }, [inventory, sales, predictions]);

 const salesTrend = useMemo(() => {
   const trendMap = {};
   sales.forEach(item => {
     const date = new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
     trendMap[date] = (trendMap[date] || 0) + Number(item.quantity || 0);
   });
   return Object.entries(trendMap).slice(-7).map(([label, value]) => ({ label, value }));
 }, [sales]);

 const itemMix = useMemo(() => {
   const totals = sales.reduce((acc,row)=>{acc[row.item]=(acc[row.item]||0)+Number(row.quantity||0); return acc;},{});
   const total = Object.values(totals).reduce((sum,v)=>sum+v,0) || 1;
   return Object.entries(totals).map(([item, value]) => ({ item, value, share: Math.round((value / total) * 100) }));
 }, [sales]);

 const predict=async()=>{
   setMessage("");
   try{
     const r=await axios.post(API+"/predictions",form);
     setResult(r.data); load();
   }catch(e){setMessage(e.response?.data?.message||"Start backend and Python server first.");}
 };
 const addSale=async()=>{await axios.post(API+"/sales",sale);setMessage("Sales saved.");load()};
 const saveStock=async()=>{await axios.post(API+"/inventory",stock);setMessage("Inventory saved.");load()};

 const login=async (loginForm)=>{
   setMessage("");
   try {
     const { data } = await axios.post(API+"/auth/login", loginForm);
     localStorage.setItem("smartcanteen-user", JSON.stringify(data.user));
     setUser(data.user);
   } catch (error) {
     setMessage(error.response?.data?.message || "Authentication failed.");
     throw error;
   }
 };

 const logout=()=>{
   localStorage.removeItem("smartcanteen-user");
   setUser(null);
 };

 const insightCards = [
   {label:"Inventory", value:stats.totalStock, hint:"Units available", icon:"📦"},
   {label:"Sales", value:stats.totalSales, hint:"Units sold", icon:"🧾"},
   {label:"Avg demand", value:stats.avgPrediction, hint:"Forecast units", icon:"📈"},
   {label:"Top item", value:stats.topItem, hint:"Best seller", icon:"⭐"}
 ];

 if (!user) return <LoginScreen onLogin={login} message={message} setMessage={setMessage} />;

 const isAdmin = user.role === "admin";

 return <div className="app-shell">
   <header className="topbar">
    <div className="brand-wrap">
     <div className="brand-icon">🍽️</div>
     <div>
      <h1>SmartCanteen</h1>
      <p>AI-powered canteen operations dashboard</p>
     </div>
    </div>
    <div className="topbar-actions">
      <div className="user-badge"><span className="role-dot" />{user.role === "admin" ? "Admin" : "Staff"}</div>
      <button className="ghost-button" onClick={logout}>Logout</button>
    </div>
   </header>

   <nav className="nav-tabs">
    <button className={tab==="dashboard"?"active":""} onClick={()=>setTab("dashboard")}>📊 Dashboard</button>
    <button className={tab==="predict"?"active":""} onClick={()=>setTab("predict")}>🤖 Predict</button>
    <button className={tab==="sales"?"active":""} onClick={()=>setTab("sales")}>🧾 Sales</button>
    <button className={tab==="inventory"?"active":""} onClick={()=>setTab("inventory")}>📦 Inventory</button>
    <button className={tab==="history"?"active":""} onClick={()=>setTab("history")}>🕘 History</button>
   </nav>

   {message&&<div className="message">{message}</div>}

   {tab==="dashboard"&&<>
     <div className="overview-grid">
      {insightCards.map(card => (
        <div key={card.label} className="metric-card">
          <div className="metric-icon">{card.icon}</div>
          <div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>{card.hint}</small>
          </div>
        </div>
      ))}
     </div>

     <section className="analytics-grid">
      <div className="card chart-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Trend overview</p>
            <h2>Sales trend</h2>
          </div>
          <span className="tag">Last 7 days</span>
        </div>
        <BarChart data={salesTrend.length ? salesTrend : [{label:"No data", value:0}]} />
      </div>

      <div className="card chart-card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Inventory health</p>
            <h2>Stock status</h2>
          </div>
          <span className="tag">{stats.lowStock} alerts</span>
        </div>
        <div className="donut-wrap">
          <div className="donut-chart" style={{background: `conic-gradient(#4f7cff 0 ${Math.min((stats.totalStock / Math.max(stats.totalSales || 1, 1)) * 100, 100)}%, #edf2ff ${Math.min((stats.totalStock / Math.max(stats.totalSales || 1, 1)) * 100, 100)}% 100%)`}}>
            <div className="donut-inner">
              <strong>{stats.totalStock}</strong>
              <span>units</span>
            </div>
          </div>
          <div className="donut-legend">
            <div><span className="legend-swatch primary"></span> Available stock</div>
            <div><span className="legend-swatch muted"></span> Buffer reserve</div>
          </div>
        </div>
      </div>
     </section>

     <section className="analytics-grid lower">
      <div className="card chart-card wide">
        <div className="section-head">
          <div>
            <p className="eyebrow">Item mix</p>
            <h2>Best selling items</h2>
          </div>
        </div>
        <div className="mix-list">
          {(itemMix.length ? itemMix : [{item:"No sales data", value:0, share:0}]).map(entry => (
            <div key={entry.item} className="mix-item">
              <div className="mix-meta"><span>{entry.item}</span><strong>{entry.value}</strong></div>
              <div className="progress-bar"><span style={{width:`${Math.max(entry.share, 8)}%`}} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card info-panel">
        <p className="eyebrow">Operations</p>
        <h2>Daily guidance</h2>
        <ul>
          <li>{isAdmin ? "Admin can review all stock and forecasting actions." : "Staff can update sales and inventory records."}</li>
          <li>Keep popular items stocked before peak lunch time.</li>
          <li>Review low-stock alerts before the next service window.</li>
        </ul>
      </div>
     </section>
   </>}

   {tab==="predict"&&<section className="content-grid">
    <div className="card large-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Demand planning</p>
          <h2>Predict Food Demand</h2>
        </div>
        <span className="tag">ML model active</span>
      </div>
      <p className="subtext">Enter today's conditions and the model will estimate how many units should be prepared.</p>
      <div className="form">
        <label>Food item<select value={form.item} onChange={e=>setForm({...form,item:e.target.value})}>{ITEMS.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Students present<input type="number" value={form.students_present} onChange={e=>setForm({...form,students_present:+e.target.value})}/></label>
        <label>Weather<select value={form.weather} onChange={e=>setForm({...form,weather:e.target.value})}><option>Sunny</option><option>Cloudy</option><option>Rainy</option></select></label>
        <label>Temperature<input type="number" value={form.temperature} onChange={e=>setForm({...form,temperature:+e.target.value})}/></label>
        <label>Price<input type="number" value={form.item_price} onChange={e=>setForm({...form,item_price:+e.target.value})}/></label>
        <label>Previous day sales<input type="number" value={form.previous_day_sales} onChange={e=>setForm({...form,previous_day_sales:+e.target.value})}/></label>
        <label>Previous week average<input type="number" value={form.previous_week_sales} onChange={e=>setForm({...form,previous_week_sales:+e.target.value})}/></label>
        <label>Exam day<select value={form.exam_day} onChange={e=>setForm({...form,exam_day:+e.target.value})}><option value="0">No</option><option value="1">Yes</option></select></label>
        <label>College event<select value={form.college_event} onChange={e=>setForm({...form,college_event:+e.target.value})}><option value="0">No</option><option value="1">Yes</option></select></label>
        <label>Holiday<select value={form.holiday} onChange={e=>setForm({...form,holiday:+e.target.value})}><option value="0">No</option><option value="1">Yes</option></select></label>
      </div>
      <button className="primary" onClick={predict}>🤖 Predict Demand</button>
    </div>

    <div className="side-stack">
      <div className="card result-card">
        <p className="eyebrow">Forecast result</p>
        {result ? <>
          <div className="number">{result.predictedDemand}</div>
          <div className="result-label">units of {result.item}</div>
          <p>Recommended prep: <strong>{result.recommendedPreparation}</strong> units</p>
        </> : <>
          <div className="empty-state">No forecast yet</div>
          <p>Submit the form to generate an AI-based demand estimate.</p>
        </>}
      </div>

      <div className="card tips-card">
        <p className="eyebrow">Quick operational notes</p>
        <ul>
          <li>Monitor stock before lunch rush.</li>
          <li>Increase prep on exam days and holidays.</li>
          <li>Keep popular snacks ready for college events.</li>
        </ul>
      </div>
    </div>
   </section>}

   {tab==="sales"&&<section className="card"><h2>Add Sales</h2><div className="form"><label>Food item<input value={sale.item} onChange={e=>setSale({...sale,item:e.target.value})}/></label><label>Quantity sold<input type="number" value={sale.quantity} onChange={e=>setSale({...sale,quantity:+e.target.value})}/></label></div><button className="primary" onClick={addSale}>Save Sales</button><h3>Recent Sales</h3><Table rows={sales} fields={["item","quantity"]}/></section>}

   {tab==="inventory"&&<section className="card"><h2>Inventory</h2><div className="form"><label>Food item<input value={stock.item} onChange={e=>setStock({...stock,item:e.target.value})}/></label><label>Available quantity<input type="number" value={stock.quantity} onChange={e=>setStock({...stock,quantity:+e.target.value})}/></label></div><button className="primary" onClick={saveStock}>Save Inventory</button><h3>Current Stock</h3><Table rows={inventory} fields={["item","quantity"]}/></section>}

   {tab==="history"&&<section className="card"><h2>Prediction History</h2><Table rows={predictions} fields={["item","predictedDemand","recommendedPreparation"]}/></section>}
 </div>
}

function LoginScreen({onLogin, message, setMessage}) {
  const [form, setForm] = useState({ username: "admin@smartcanteen", password: "Admin@123" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await onLogin(form);
    } catch {
      // handled in parent
    } finally {
      setLoading(false);
    }
  };

  return <div className="auth-shell">
    <div className="auth-card">
      <div className="auth-brand">
        <div className="brand-icon">🍽️</div>
        <div>
          <h1>SmartCanteen</h1>
          <p>College canteen AI operations</p>
        </div>
      </div>

      <div className="auth-copy">
        <h2>Secure login</h2>
        <p>Use the admin or staff account to access the dashboard.</p>
      </div>

      {message && <div className="message auth-message">{message}</div>}

      <form onSubmit={submit} className="auth-form">
        <label>Email<input value={form.username} onChange={e=>setForm({...form, username:e.target.value})} /></label>
        <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></label>
        <div className="credentials-box">
          <span><strong>Admin</strong> admin@smartcanteen / Admin@123</span>
          <span><strong>Staff</strong> staff@smartcanteen / Staff@123</span>
        </div>
        <button className="primary auth-button" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login to dashboard"}
        </button>
      </form>
    </div>
  </div>;
}

function BarChart({ data }) {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  return <div className="bar-chart">
    {data.map((item) => (
      <div key={item.label} className="bar-group">
        <div className="bar-wrap">
          <div className="bar" style={{ height: `${(item.value / maxValue) * 100}%` }} title={`${item.label}: ${item.value}`} />
        </div>
        <span>{item.label}</span>
      </div>
    ))}
  </div>;
}

function Table({rows,fields}){return <table><thead><tr>{fields.map(f=><th key={f}>{f}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r._id||i}>{fields.map(f=><td key={f}>{r[f]}</td>)}</tr>)}</tbody></table>}
createRoot(document.getElementById("root")).render(<App/>);
