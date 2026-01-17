import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
  Activity, BrainCircuit, ShieldCheck, Shield, Target, Zap, 
  TrendingUp, Database, Layers, Search, RefreshCw, 
  Users, FileText, UploadCloud, LayoutPanelLeft, 
  Fingerprint, Menu, Server, Lock
} from 'lucide-react';
import { motion } from 'framer-motion'; // Visual animation only
import styles from './Dashboard.module.css';

function App() {
  const [rawData, setRawData] = useState([]);
  const [governanceData, setGovernanceData] = useState([]);
  const [predictionDetails, setPredictionDetails] = useState(null);
  const [status, setStatus] = useState("INITIALIZING");
  const [activeModel, setActiveModel] = useState('XGBoost');
  const [aiBriefing, setAiBriefing] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pivotX, setPivotX] = useState('district');
  const [pivotY, setPivotY] = useState('total_updates');
  const [uploadStatus, setUploadStatus] = useState(null);

  // --- LOGIC: INITIAL LOAD (UNTOUCHED) ---
  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get('https://aadhaar-drishti.onrender.com/api/summary');
        setRawData(res.data || []);
        setStatus("SYSTEM ONLINE");
      } catch (err) {
        setStatus("CONNECTION ERROR");
      }
    };
    init();
  }, []);

  // --- LOGIC: SECONDARY LOAD (UNTOUCHED) ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [resRadar, resPred] = await Promise.all([
          axios.get('https://aadhaar-drishti.onrender.com/api/governance-indices'),
          axios.get('https://aadhaar-drishti.onrender.com/api/model-comparison')
        ]);
        setGovernanceData(resRadar.data);
        setPredictionDetails(resPred.data);
      } catch (err) {
        console.error("Deep analytics sync failed");
      }
    };
    if (rawData.length > 0) fetchAnalytics();
  }, [rawData]);

  // --- LOGIC: TRANSFORMATIONS (UNTOUCHED) ---
  const trendData = useMemo(() => {
    if (!rawData.length) return [];
    const map = rawData.reduce((acc, curr) => {
      const d = curr.date || 'N/A';
      if (!acc[d]) acc[d] = { date: d, updates: 0, enrolments: 0 };
      acc[d].updates += curr.total_updates || 0;
      acc[d].enrolments += curr.total_enrolment || 0;
      return acc;
    }, {});
    return Object.values(map).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [rawData]);

  const studioData = useMemo(() => {
    if (!rawData.length) return [];
    const map = rawData.reduce((acc, curr) => {
      const xVal = curr[pivotX] || "Unknown";
      if (!acc[xVal]) acc[xVal] = { name: xVal, value: 0 };
      acc[xVal].value += (curr[pivotY] || 0);
      return acc;
    }, {});
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 12);
  }, [rawData, pivotX, pivotY]);

  const chartData = useMemo(() => {
    if (!trendData.length || !predictionDetails) return trendData;

    const lastActual = trendData[trendData.length - 1];
    const xgbVal = parseFloat(predictionDetails.xgboost.val) * 1000000;
    const rfVal = parseFloat(predictionDetails.random_forest.val) * 1000000;

    const forecastNode = {
      date: "Next Cycle (Est)",
      updates: null,
      enrolments: null,
      xgbForecast: xgbVal,
      rfForecast: rfVal,
    };

    const updatedHistory = trendData.map((d, i) => 
      i === trendData.length - 1 
        ? { ...d, xgbForecast: d.updates, rfForecast: d.updates } 
        : d
    );

    return [...updatedHistory, forecastNode];
  }, [trendData, predictionDetails]);

  const demographicSplit = useMemo(() => {
    if (!rawData.length) return [];
    const s = rawData.reduce((acc, curr) => {
      acc.infants += (curr.age_0_5 || 0);
      acc.students += (curr.age_5_17 || 0);
      acc.adults += (curr.age_18_greater || 0);
      return acc;
    }, { infants: 0, students: 0, adults: 0 });
    return [
      { name: 'Infants (0-5)', value: s.infants, color: '#38bdf8' },
      { name: 'Students (5-17)', value: s.students, color: '#818cf8' },
      { name: 'Adults (18+)', value: s.adults, color: '#c084fc' }
    ];
  }, [rawData]);

  // --- LOGIC: ACTIONS (UNTOUCHED) ---
  const generateBriefing = async () => {
    setIsAiLoading(true);
    const modelKey = activeModel === 'XGBoost' ? 'xgboost' : 'random_forest';
    const currentPred = predictionDetails?.[modelKey];

    try {
      const res = await axios.post('https://aadhaar-drishti.onrender.com/api/ai-interpret', {
        model: activeModel,
        volume: currentPred?.val || "N/A",
        confidence: `${(currentPred?.confidence * 100).toFixed(1)}%`,
        district: "National Strategic Grid"
      });
      setAiBriefing(res.data.interpretation);
    } catch (err) {
      setAiBriefing("Strategic Briefing failed. Verify backend AI configuration.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    setUploadStatus("Ingesting...");
    try {
      await axios.post('https://aadhaar-drishti.onrender.com/api/upload-data', formData);
      setUploadStatus("Ingestion Complete");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setUploadStatus("Ingestion Failed");
    }
  };

  // --- VIEW: LOADING STATE ---
  if (status === "INITIALIZING") return (
    <div className={styles.loaderContainer}>
      <div className={styles.loaderIcon}><Fingerprint size={64} strokeWidth={1} /></div>
      <div className={styles.loaderText}>
        <span>ESTABLISHING SECURE CONNECTION</span>
        <span className={styles.loaderSub}>AADHAAR DRISHTI GOVERNANCE NODE</span>
      </div>
    </div>
  );

  return (
    <div className={styles.appWrapper}>
      <main className={styles.container}>
        
        {/* HEADER: Responsive Flex */}
        <header className={styles.header}>
          <div className={styles.brandGroup}>
            <div className={styles.logoBadge}><Fingerprint size={24} /></div>
            <div className={styles.titles}>
              <h1>AADHAAR DRISHTI</h1>
              <p>MeitY Analytics & Governance Composite</p>
            </div>
          </div>
          <div className={styles.headerMeta}>
            <div className={`${styles.statusBadge} ${status === "SYSTEM ONLINE" ? styles.success : styles.error}`}>
              <div className={styles.pulseDot}></div>
              <span>{status}</span>
            </div>
            <span className={styles.version}>v4.1.0-GOV</span>
          </div>
        </header>

        {/* KPI GRID: Responsive Grid (1col mobile -> 3col desktop) */}
        <motion.section 
          className={styles.kpiGrid}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.card}>
            <div className={styles.cardIcon}><Database size={20} /></div>
            <div className={styles.cardContent}>
              <h3>Lifecycle Nodes</h3>
              <div className={styles.statValue}>{rawData.length.toLocaleString()}</div>
              <div className={styles.statSub}>Total Live Records</div>
            </div>
          </div>
          
          <div className={styles.card}>
            <div className={styles.cardIcon}><Target size={20} /></div>
            <div className={styles.cardContent}>
              <h3>Model Confidence</h3>
              <div className={styles.statValue}>
                {(predictionDetails?.[activeModel === 'XGBoost' ? 'xgboost' : 'random_forest']?.confidence * 100)?.toFixed(1)}%
              </div>
              <div className={styles.statSub}>Active Accuracy</div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardIcon}><ShieldCheck size={20} /></div>
            <div className={styles.cardContent}>
              <h3>System Protocol</h3>
              <div className={styles.statValue}>Phase IV</div>
              <div className={styles.statSub}>Maintenance Mode</div>
            </div>
          </div>
        </motion.section>

        {/* MAIN CONTENT GRID: Asymmetrical Layout */}
        <div className={styles.mainContentGrid}>
          
          {/* LEFT COLUMN: PRIMARY VISUALIZATIONS */}
          <div className={styles.colLeft}>
            
            {/* SECTION: TRENDS */}
            <motion.section 
              className={styles.panel}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            >
              <div className={styles.panelHeader}>
                <h2><Activity size={18} /> National Velocity Forecast</h2>
                <div className={styles.legendGroup}>
                  <div className={styles.legendItem}><span style={{background: 'var(--primary)'}}></span>Actual</div>
                  <div className={styles.legendItem}><span style={{border: '1px dashed var(--secondary)'}}></span>Proj.</div>
                </div>
              </div>
              <div className={styles.chartContainerLarge}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                    <defs>
                      <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px', color: 'var(--text-main)' }}
                    />
                    <Area type="monotone" dataKey="updates" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorUpdates)" />
                    {/* Forecast Lines */}
                    <Area type="monotone" dataKey="xgbForecast" stroke="var(--primary)" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                    <Area type="monotone" dataKey="rfForecast" stroke="var(--secondary)" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* SECTION: DISCOVERY */}
            <motion.section 
              className={styles.panel}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            >
              <div className={styles.panelHeaderStacked}>
                <h2><Search size={18} /> Regional Discovery Studio</h2>
                <div className={styles.controlsRow}>
                  <div className={styles.selectBox}>
                    <label>DIMENSION</label>
                    <select value={pivotX} onChange={(e)=>setPivotX(e.target.value)}>
                      <option value="state">By State</option>
                      <option value="district">By District</option>
                      <option value="date">Timeline</option>
                    </select>
                  </div>
                  <div className={styles.selectBox}>
                    <label>METRIC</label>
                    <select value={pivotY} onChange={(e)=>setPivotY(e.target.value)}>
                      <option value="total_updates">Total Updates</option>
                      <option value="total_enrolment">Enrolments</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.chartContainerMedium}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studioData} margin={{left: -20, bottom: 20}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} angle={-15} textAnchor="end" />
                    <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {studioData.map((e, i) => <Cell key={i} fill={i === 0 ? 'var(--secondary)' : 'var(--primary)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          </div>

          {/* RIGHT COLUMN: INTELLIGENCE & UTILS */}
          <div className={styles.colRight}>
            
            {/* SECTION: GOVERNANCE RADAR */}
            <motion.section 
              className={styles.panel}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            >
              <div className={styles.panelHeader}>
                <h2><LayoutPanelLeft size={18} /> Governance Index</h2>
              </div>
              <div className={styles.chartContainerSquare}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={governanceData}>
                    <PolarGrid stroke="var(--border-active)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                    <Radar name="Status" dataKey="A" stroke="var(--accent-success)" strokeWidth={2} fill="var(--accent-success)" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.section>

            {/* SECTION: PREDICTION LAB */}
            <motion.section className={`${styles.panel} ${styles.predictionLab}`}>
              <div className={styles.panelHeader}>
                <h2><BrainCircuit size={18} /> Prediction Lab</h2>
              </div>
              
              <div className={styles.toggleRow}>
                <button 
                  className={activeModel === 'XGBoost' ? styles.toggleActive : styles.toggleBtn}
                  onClick={() => {setActiveModel('XGBoost'); setAiBriefing("");}}
                >
                  XGBoost
                </button>
                <button 
                  className={activeModel === 'RandomForest' ? styles.toggleActive : styles.toggleBtn}
                  onClick={() => {setActiveModel('RandomForest'); setAiBriefing("");}}
                >
                  R-Forest
                </button>
              </div>

              <div className={styles.predictionDisplay}>
                <span className={styles.predLabel}>PROJECTED VOLUME</span>
                <span className={styles.predNumber}>
                  {predictionDetails?.[activeModel.toLowerCase().replace('forest', '_forest')]?.val || "---"}
                </span>
                <span className={styles.predMeta}>
                  Confidence: {predictionDetails?.[activeModel.toLowerCase().replace('forest', '_forest')]?.confidence 
                    ? `${(predictionDetails[activeModel.toLowerCase().replace('forest', '_forest')].confidence * 100).toFixed(1)}%` 
                    : "---"}
                </span>
              </div>

              <button className={styles.actionBtn} onClick={generateBriefing} disabled={isAiLoading}>
                {isAiLoading ? <RefreshCw className={styles.spin} size={16}/> : <Zap size={16}/>}
                <span>{isAiLoading ? "PROCESSING..." : "GENERATE AI BRIEFING"}</span>
              </button>
              
              {aiBriefing && (
                <div className={styles.aiOutput}>
                  <div className={styles.aiHeader}>GEMINI-1.5-GOV-PRO</div>
                  <p>{aiBriefing}</p>
                </div>
              )}
            </motion.section>

            {/* SECTION: DEMOGRAPHICS & UPLOAD */}
            <div className={styles.stackSmall}>
               <section className={styles.panel}>
                 <div className={styles.panelHeader}>
                   <h2><Users size={18} /> Demographics</h2>
                 </div>
                 <div className={styles.chartContainerSmall}>
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={demographicSplit} layout="vertical" margin={{left: -20}}>
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={10} width={80} tickLine={false} axisLine={false} />
                       <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                         {demographicSplit.map((e, i) => <Cell key={i} fill={e.color} />)}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </section>

               <section className={styles.uploadPanel}>
                 <div className={styles.uploadHeader}><UploadCloud size={16} /> DATA INGESTION</div>
                 <label className={styles.uploadBtn}>
                   SELECT SECURE CSV
                   <input type="file" hidden onChange={handleFileUpload} accept=".csv" />
                 </label>
                 {uploadStatus && <span className={styles.uploadStatus}>{uploadStatus}</span>}
               </section>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerBrand}><Shield size={14} /> <span>UIDAI ANALYTICS COMPOSITE</span></div>
          <div className={styles.footerMeta}>OFFICIAL USE ONLY • RESTRICTED ACCESS</div>
        </footer>
      </main>
    </div>
  );
}

export default App;