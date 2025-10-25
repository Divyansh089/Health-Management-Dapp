// Test data generator for dashboard charts
export function generateMockActivityData() {
  const days = 12;
  const appointments = [];
  const prescriptions = [];
  
  for (let i = 0; i < days; i++) {
    // Generate some realistic activity patterns
    const baseActivity = Math.floor(Math.random() * 15) + 5;
    const prescActivity = Math.floor(Math.random() * 10) + 2;
    
    appointments.push(baseActivity);
    prescriptions.push(prescActivity);
  }
  
  return { appointments, prescriptions };
}

export function generateMockRevenueData() {
  const days = 7;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const revenue = Math.random() * 0.5 + 0.1; // 0.1 to 0.6 ETH
    
    data.push({
      t: date.toISOString().slice(5, 10), // MM-DD format
      v: revenue
    });
  }
  
  return data;
}

export function generateMockMedicineData() {
  const days = 7;
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const count = Math.floor(Math.random() * 8) + 1;
    
    data.push({
      t: date.toISOString().slice(5, 10), // MM-DD format
      v: count
    });
  }
  
  return data;
}

export function generateMockDoctorStats() {
  return {
    approvalStats: [
      { label: "Approved", value: 12 },
      { label: "Pending", value: 3 }
    ],
    performanceData: [
      { t: "Dr. Smith", v: 95 },
      { t: "Dr. Jones", v: 88 },
      { t: "Dr. Brown", v: 92 },
      { t: "Dr. Davis", v: 85 },
      { t: "Dr. Wilson", v: 90 }
    ]
  };
}

export function generateMockMedicineStats() {
  return {
    inventoryStats: [
      { label: "Active", value: 45 },
      { label: "Inactive", value: 8 },
      { label: "Out of Stock", value: 3 },
      { label: "Low Stock", value: 7 }
    ],
    stockLevels: [
      { t: "Aspirin", v: 150 },
      { t: "Ibuprofen", v: 120 },
      { t: "Acetamin", v: 95 },
      { t: "Vitamin C", v: 200 },
      { t: "Bandages", v: 75 },
      { t: "Antisept", v: 60 },
      { t: "Gauze", v: 40 },
      { t: "Insulin", v: 25 }
    ]
  };
}