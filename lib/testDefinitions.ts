export const TEST_CATEGORIES = [
  {
    id: "Blood",
    name: "Blood Tests",
    icon: "🩸",
    description: "Lab work & blood panels",
    examples: "CBC, Lipid Profile, Blood Sugar, Liver Function",
    color: "#ef4444",
  },
  {
    id: "Vitals",
    name: "Vitals",
    icon: "💓",
    description: "Basic health measurements",
    examples: "Blood Pressure, Weight, Temperature, Heart Rate",
    color: "#f59e0b",
  },
  {
    id: "Imaging",
    name: "Imaging",
    icon: "🔬",
    description: "Scans & medical imaging",
    examples: "X-Ray, MRI, CT Scan, Ultrasound",
    color: "#8b5cf6",
  },
  {
    id: "Urine",
    name: "Urine Tests",
    icon: "🧪",
    description: "Urinalysis & related",
    examples: "Routine Urine, Microalbumin, Culture",
    color: "#14b8a6",
  },
  {
    id: "Pathology",
    name: "Pathology",
    icon: "🔍",
    description: "Tissue & cell analysis",
    examples: "Biopsy, Histopathology, Cytology",
    color: "#06b6d4",
  },
  {
    id: "Cardiology",
    name: "Cardiology",
    icon: "❤️",
    description: "Heart-related tests",
    examples: "ECG, Echo, Stress Test, Holter Monitor",
    color: "#ec4899",
  },
  {
    id: "Other",
    name: "Other Tests",
    icon: "📋",
    description: "Specialized tests",
    examples: "Vision, Hearing, Allergy, Sleep Study",
    color: "#6b7280",
  },
];

export const COMMON_TESTS: Record<string, any[]> = {
  Blood: [
    {
      name: "Complete Blood Count (CBC)",
      parameters: [
        { name: "Hemoglobin", unit: "g/dL", normalRange: "13.5-17.5" },
        { name: "WBC", unit: "/μL", normalRange: "4000-11000" },
        { name: "RBC", unit: "million/μL", normalRange: "4.5-5.5" },
        { name: "Platelets", unit: "/μL", normalRange: "150000-400000" },
      ],
    },
    {
      name: "Lipid Profile",
      parameters: [
        { name: "Total Cholesterol", unit: "mg/dL", normalRange: "<200" },
        { name: "LDL", unit: "mg/dL", normalRange: "<100" },
        { name: "HDL", unit: "mg/dL", normalRange: ">40" },
        { name: "Triglycerides", unit: "mg/dL", normalRange: "<150" },
      ],
    },
    {
      name: "Blood Sugar",
      parameters: [
        { name: "Fasting Glucose", unit: "mg/dL", normalRange: "70-100" },
        { name: "HbA1c", unit: "%", normalRange: "<5.7" },
      ],
    },
    {
      name: "Liver Function Test (LFT)",
      parameters: [
        { name: "SGOT/AST", unit: "U/L", normalRange: "5-40" },
        { name: "SGPT/ALT", unit: "U/L", normalRange: "7-56" },
        { name: "Bilirubin", unit: "mg/dL", normalRange: "0.3-1.2" },
      ],
    },
    {
      name: "Kidney Function Test (KFT)",
      parameters: [
        { name: "Creatinine", unit: "mg/dL", normalRange: "0.7-1.3" },
        { name: "Urea", unit: "mg/dL", normalRange: "15-40" },
      ],
    },
    {
      name: "Thyroid Profile",
      parameters: [
        { name: "TSH", unit: "mIU/L", normalRange: "0.4-4.0" },
        { name: "T3", unit: "ng/dL", normalRange: "80-200" },
        { name: "T4", unit: "μg/dL", normalRange: "5-12" },
      ],
    },
    {
      name: "Custom Blood Test",
      parameters: [],
    },
  ],
  Vitals: [
    {
      name: "Blood Pressure",
      parameters: [
        { name: "Systolic", unit: "mmHg", normalRange: "<120" },
        { name: "Diastolic", unit: "mmHg", normalRange: "<80" },
      ],
    },
    {
      name: "Body Measurements",
      parameters: [
        { name: "Weight", unit: "kg", normalRange: "" },
        { name: "Height", unit: "cm", normalRange: "" },
        { name: "BMI", unit: "kg/m²", normalRange: "18.5-24.9" },
      ],
    },
    {
      name: "Temperature",
      parameters: [
        { name: "Body Temperature", unit: "°F", normalRange: "97-99" },
      ],
    },
    {
      name: "Heart Rate",
      parameters: [{ name: "Heart Rate", unit: "bpm", normalRange: "60-100" }],
    },
    {
      name: "Oxygen Saturation",
      parameters: [{ name: "SpO2", unit: "%", normalRange: "95-100" }],
    },
    {
      name: "Custom Vital",
      parameters: [],
    },
  ],
  Imaging: [
    { name: "X-Ray", parameters: [] },
    { name: "MRI Scan", parameters: [] },
    { name: "CT Scan", parameters: [] },
    { name: "Ultrasound", parameters: [] },
    { name: "PET Scan", parameters: [] },
    { name: "Mammography", parameters: [] },
    { name: "Custom Imaging", parameters: [] },
  ],
  Urine: [
    {
      name: "Routine Urine Analysis",
      parameters: [
        { name: "Color", unit: "", normalRange: "Yellow" },
        { name: "pH", unit: "", normalRange: "5-7" },
        { name: "Protein", unit: "", normalRange: "Nil" },
        { name: "Glucose", unit: "", normalRange: "Nil" },
      ],
    },
    {
      name: "Urine Culture",
      parameters: [],
    },
    {
      name: "Custom Urine Test",
      parameters: [],
    },
  ],
  Pathology: [
    { name: "Biopsy", parameters: [] },
    { name: "Histopathology", parameters: [] },
    { name: "Cytology", parameters: [] },
    { name: "PAP Smear", parameters: [] },
    { name: "Custom Pathology", parameters: [] },
  ],
  Cardiology: [
    { name: "ECG/EKG", parameters: [] },
    { name: "Echocardiogram", parameters: [] },
    { name: "Stress Test", parameters: [] },
    { name: "Holter Monitor", parameters: [] },
    { name: "Custom Cardiology", parameters: [] },
  ],
  Other: [
    { name: "Vision Test", parameters: [] },
    { name: "Hearing Test", parameters: [] },
    { name: "Allergy Test", parameters: [] },
    { name: "Pulmonary Function Test", parameters: [] },
    { name: "Sleep Study", parameters: [] },
    { name: "Bone Density (DEXA)", parameters: [] },
    { name: "Custom Test", parameters: [] },
  ],
};
