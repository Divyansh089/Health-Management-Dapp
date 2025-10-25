import { useState, useEffect } from "react";

// Demo component to simulate data loading and show graphs working
export function DashboardDemo({ onDataGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDemoData = async () => {
    setIsGenerating(true);
    
    // Simulate data generation with random delays
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      await delay(500); // Simulate API calls
      
      const demoData = {
        stats: {
          doctorCount: Math.floor(Math.random() * 50) + 10,
          patientCount: Math.floor(Math.random() * 200) + 50,
          medicineCount: Math.floor(Math.random() * 100) + 30,
          appointmentCount: Math.floor(Math.random() * 500) + 100,
          prescriptionCount: Math.floor(Math.random() * 300) + 80
        },
        activity: {
          appointments: Array.from({ length: 12 }, () => Math.floor(Math.random() * 20) + 5),
          prescriptions: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15) + 3)
        },
        revenue: Array.from({ length: 7 }, (_, i) => ({
          t: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().slice(5, 10),
          v: Math.random() * 0.8 + 0.2
        })),
        medicinesAdded: Array.from({ length: 7 }, (_, i) => ({
          t: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().slice(5, 10),
          v: Math.floor(Math.random() * 8) + 1
        }))
      };
      
      if (onDataGenerated) {
        onDataGenerated(demoData);
      }
      
    } catch (error) {
      console.error("Error generating demo data:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="demo-controls">
      <button 
        className="btn-demo"
        onClick={generateDemoData}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "🎲 Generate Demo Data"}
      </button>
      {isGenerating && (
        <div className="demo-status">
          <div className="demo-spinner"></div>
          <span>Simulating blockchain data...</span>
        </div>
      )}
    </div>
  );
}

// CSS for demo controls (add to Admin.css)
const demoStyles = `
.demo-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
}

.btn-demo {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.btn-demo:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
}

.btn-demo:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.demo-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3b82f6;
  font-weight: 600;
  font-size: 0.9rem;
}

.demo-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default DashboardDemo;