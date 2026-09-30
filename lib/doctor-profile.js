// Options shared by the doctor profile form (dropdowns) and the API that validates them
export const DOCTOR_SPECIALTIES = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Gynecologist',
  'Neurologist',
  'Ophthalmologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Urologist',
];

export const DOCTOR_LOCATIONS = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad'];

export const DOCTOR_LANGUAGES = ['English', 'Urdu', 'Punjabi', 'Pashto', 'Sindhi', 'Balochi', 'Arabic'];

export const DOCTOR_TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

// Offered until a doctor customises their own slots on the profile page
export const DEFAULT_TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

export const MAX_AVATAR_LENGTH = 200000;
export const MAX_REPORT_FILE_LENGTH = 3000000; // characters of the data URL (~2 MB file)

export const REPORT_IMAGE_MODALITIES = [
  'X-ray (Chest)', 'X-ray (Bone)', 'MRI (Brain)', 'MRI (Spine)', 'MRI (Knee)', 'CT Scan (Chest)',
  'CT Scan (Abdomen)', 'CT Scan (Brain)', 'Ultrasound (Abdomen)', 'Ultrasound (Pregnancy)', 'Mammogram',
];

export const REPORT_LAB_TESTS = [
  'Complete Blood Count (CBC)', 'Lipid Profile', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)',
  'Thyroid Function Test', 'Blood Glucose Test', 'HbA1c', 'Vitamin Panel', 'Urinalysis', 'Other Blood Test',
];
