import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiArrowRight, FiPlus, FiX, FiSearch } from "react-icons/fi";
import { RiRobot2Line, RiHeartPulseLine } from "react-icons/ri";
import { aiAPI } from "../../api";
import { Button, StatusBadge, Card } from "../../components/common";
import { toast } from "react-toastify";

const COMMON_SYMPTOMS = [
  "Fever", "Headache", "Cough", "Sore throat", "Fatigue",
  "Nausea", "Chest pain", "Back pain", "Shortness of breath",
  "Dizziness", "Stomach ache", "Vomiting", "Joint pain", "Rash",
  "Loss of appetite", "Chills", "Muscle pain", "Runny nose",
];

const UrgencyConfig = {
  low: { color: "text-teal-400", bg: "from-teal-500/20 to-teal-600/10 border-teal-500/30", emoji: "🟢", label: "Low Urgency" },
  medium: { color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10 border-amber-500/30", emoji: "🟡", label: "Medium Urgency" },
  high: { color: "text-red-400", bg: "from-red-500/20 to-red-600/10 border-red-500/30", emoji: "🔴", label: "High Urgency" },
  emergency: { color: "text-red-300", bg: "from-red-700/30 to-red-800/10 border-red-500/50", emoji: "🚨", label: "EMERGENCY" },
};

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [existingConditions, setExistingConditions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const addSymptom = (symptom) => {
    if (!symptoms.includes(symptom) && symptoms.length < 10) {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const removeSymptom = (symptom) => setSymptoms(symptoms.filter((s) => s !== symptom));

  const addCustomSymptom = () => {
    const s = customSymptom.trim();
    if (s && !symptoms.includes(s) && symptoms.length < 10) {
      addSymptom(s);
      setCustomSymptom("");
    }
  };

  const handleAnalyze = async () => {
    if (symptoms.length === 0) {
      toast.warning("Please add at least one symptom");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await aiAPI.checkSymptoms({ symptoms, age, gender, existingConditions });
      setResult(data.analysis);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.message || "AI analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetChecker = () => {
    setResult(null);
    setSymptoms([]);
    setAge("");
    setGender("");
    setExistingConditions("");
  };

  const urgency = result ? UrgencyConfig[result.urgencyLevel] || UrgencyConfig.medium : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
          <RiRobot2Line className="text-purple-400" />
          <span className="text-purple-400 text-sm font-medium">Powered by Google Gemini AI</span>
        </div>
        <h1 className="font-display font-bold text-white text-3xl mb-2">AI Symptom Checker</h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto">
          Describe your symptoms and get an instant AI-powered health assessment with specialist recommendations.
        </p>
      </div>

      {!result ? (
        <div className="space-y-6">
          {/* Symptom Input */}
          <Card className="p-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <RiHeartPulseLine className="text-teal-400" /> Select Your Symptoms
              <span className="ml-auto text-slate-500 text-xs font-normal">{symptoms.length}/10</span>
            </h2>

            {/* Common symptoms grid */}
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_SYMPTOMS.map((s) => (
                <button
                  key={s}
                  onClick={() => symptoms.includes(s) ? removeSymptom(s) : addSymptom(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${symptoms.includes(s)
                      ? "bg-teal-500/20 text-teal-400 border-teal-500/50"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:border-teal-500/50 hover:text-white"
                    }`}
                >
                  {symptoms.includes(s) ? "✓ " : ""}{s}
                </button>
              ))}
            </div>

            {/* Custom symptom input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomSymptom()}
                  placeholder="Add custom symptom..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50"
                />
              </div>
              <Button variant="outline" size="sm" onClick={addCustomSymptom}>Add</Button>
            </div>

            {/* Selected symptoms */}
            {symptoms.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {symptoms.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 bg-teal-500/15 text-teal-400 border border-teal-500/30 rounded-full px-3 py-1 text-xs font-medium">
                    {s}
                    <button onClick={() => removeSymptom(s)} className="hover:text-red-400 transition-colors">
                      <FiX className="text-xs" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Patient Info */}
          <Card className="p-6">
            <h2 className="text-white font-semibold mb-4">Patient Information <span className="text-slate-500 font-normal text-sm">(optional)</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Age</label>
                <input
                  type="number" min="1" max="120"
                  value={age} onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 28"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-teal-500/50">
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-400">Existing Conditions</label>
                <input
                  value={existingConditions} onChange={(e) => setExistingConditions(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>
          </Card>

          {/* Analyze Button */}
          <Button
            variant="primary"
            size="lg"
            loading={loading}
            onClick={handleAnalyze}
            disabled={symptoms.length === 0}
            className="w-full justify-center shadow-2xl shadow-teal-500/20"
          >
            <RiRobot2Line className="text-xl" />
            {loading ? "Analyzing with Gemini AI..." : "Analyze My Symptoms"}
          </Button>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <FiAlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs leading-relaxed">
              This AI tool provides general health information only and is <strong className="text-amber-400">not a medical diagnosis</strong>. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="space-y-5 animate-slide-up">
          {/* Urgency Banner */}
          <div className={`bg-gradient-to-r ${urgency.bg} border rounded-2xl p-6`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{urgency.emoji}</span>
                  <div>
                    <p className="text-white font-display font-bold text-xl">{urgency.label}</p>
                    <p className={`${urgency.color} text-sm`}>{result.urgencyExplanation}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={resetChecker}>New Check</Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate("/patient/doctors")}
                >
                  Find {result.recommendedSpecialization} <FiArrowRight />
                </Button>
              </div>
            </div>
          </div>

          {/* Recommended Specialty */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FiSearch className="text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Recommended Specialist</p>
                <p className="text-white font-semibold font-display">{result.recommendedSpecialization}</p>
              </div>
            </div>
          </Card>

          {/* Possible Conditions */}
          <Card className="p-5">
            <h3 className="text-white font-semibold mb-4">Possible Conditions</h3>
            <div className="space-y-3">
              {result.possibleConditions?.map((condition, i) => (
                <div key={i} className="flex items-start justify-between gap-4 p-3 bg-slate-800/60 rounded-xl">
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{condition.name}</p>
                    <p className="text-slate-400 text-xs mt-1">{condition.description}</p>
                  </div>
                  <StatusBadge status={condition.probability} />
                </div>
              ))}
            </div>
          </Card>

          {/* Immediate Actions */}
          {result.immediateActions?.length > 0 && (
            <Card className="p-5">
              <h3 className="text-white font-semibold mb-3">Immediate Actions</h3>
              <ul className="space-y-2">
                {result.immediateActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                    <span className="w-5 h-5 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Lifestyle Tips */}
          {result.lifestyle?.length > 0 && (
            <Card className="p-5">
              <h3 className="text-white font-semibold mb-3">Lifestyle Recommendations</h3>
              <ul className="space-y-2">
                {result.lifestyle.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-teal-400 mt-0.5">•</span>{tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
            <FiAlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-400 text-xs">{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SymptomChecker;