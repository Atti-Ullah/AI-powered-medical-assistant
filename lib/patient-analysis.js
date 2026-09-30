// Rule-based screening of a patient's recorded vitals and profile.
//
// This is decision support for a clinician, not a diagnosis: every flag states the value that
// triggered it and a consideration for review, and nothing is inferred beyond the recorded data.

export const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, info: 3 };

export const SEVERITY_LABELS = {
  high: 'High priority',
  medium: 'Needs review',
  low: 'Monitor',
  info: 'Note',
};

export function parseBloodPressure(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
  if (!match) return null;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (systolic < 50 || systolic > 300 || diastolic < 30 || diastolic > 200) return null;
  return { systolic, diastolic };
}

export function calculateBmi(height, weight) {
  const h = Number(height);
  const w = Number(weight);
  if (!h || !w || h < 50 || h > 250 || w < 2 || w > 400) return null;
  return Math.round((w / Math.pow(h / 100, 2)) * 10) / 10;
}

export function ageFromDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
  if (beforeBirthday) age--;
  return age >= 0 && age < 130 ? age : null;
}

const flag = (id, severity, title, detail, suggestion, value) => ({ id, severity, title, detail, suggestion, value });

// `metrics` is the latest recorded set, `profile` the patient's profile fields.
export function analyzePatient(metrics, profile = {}) {
  const flags = [];
  const m = metrics || {};

  const bp = parseBloodPressure(m.bloodPressure);
  if (bp) {
    const label = `${bp.systolic}/${bp.diastolic} mmHg`;
    if (bp.systolic >= 180 || bp.diastolic >= 120) {
      flags.push(flag('bp', 'high', 'Severely elevated blood pressure', `Recorded ${label}, in the hypertensive-crisis range.`, 'Consider urgent clinical assessment and repeat measurement.', label));
    } else if (bp.systolic >= 140 || bp.diastolic >= 90) {
      flags.push(flag('bp', 'high', 'High blood pressure (stage 2 range)', `Recorded ${label}.`, 'Consider confirming with repeat readings and reviewing treatment.', label));
    } else if (bp.systolic >= 130 || bp.diastolic >= 80) {
      flags.push(flag('bp', 'medium', 'Elevated blood pressure (stage 1 range)', `Recorded ${label}.`, 'Consider lifestyle review and follow-up monitoring.', label));
    } else if (bp.systolic < 90 || bp.diastolic < 60) {
      flags.push(flag('bp', 'medium', 'Low blood pressure', `Recorded ${label}.`, 'Consider checking for symptoms such as dizziness and reviewing medications.', label));
    }
  }

  const hr = Number(m.heartRate);
  if (hr) {
    if (hr > 120) {
      flags.push(flag('hr', 'high', 'Markedly raised heart rate', `Recorded ${hr} bpm.`, 'Consider assessing for arrhythmia, infection, pain or anxiety.', `${hr} bpm`));
    } else if (hr > 100) {
      flags.push(flag('hr', 'medium', 'Raised resting heart rate', `Recorded ${hr} bpm (above 100).`, 'Consider repeating at rest and reviewing contributing factors.', `${hr} bpm`));
    } else if (hr < 50) {
      flags.push(flag('hr', 'medium', 'Low heart rate', `Recorded ${hr} bpm (below 50).`, 'Consider whether this is expected for the patient and check for symptoms.', `${hr} bpm`));
    }
  }

  const glucose = Number(m.glucoseLevel);
  if (glucose) {
    if (glucose < 70) {
      flags.push(flag('glucose', 'high', 'Low blood glucose', `Recorded ${glucose} mg/dL.`, 'Consider hypoglycaemia assessment and medication review.', `${glucose} mg/dL`));
    } else if (glucose >= 200) {
      flags.push(flag('glucose', 'high', 'Very high blood glucose', `Recorded ${glucose} mg/dL.`, 'Consider confirmatory testing (fasting glucose or HbA1c) and diabetes management review.', `${glucose} mg/dL`));
    } else if (glucose >= 126) {
      flags.push(flag('glucose', 'medium', 'Elevated blood glucose', `Recorded ${glucose} mg/dL, in the range associated with diabetes when fasting.`, 'Consider fasting glucose or HbA1c to confirm.', `${glucose} mg/dL`));
    } else if (glucose >= 100) {
      flags.push(flag('glucose', 'low', 'Borderline blood glucose', `Recorded ${glucose} mg/dL.`, 'Consider lifestyle advice and periodic re-testing.', `${glucose} mg/dL`));
    }
  }

  const bmi = Number(m.bmi) || calculateBmi(m.height, m.weight);
  if (bmi) {
    if (bmi >= 35) {
      flags.push(flag('bmi', 'medium', 'Class II or III obesity range', `Calculated BMI ${bmi}.`, 'Consider weight-management support and cardiometabolic screening.', `BMI ${bmi}`));
    } else if (bmi >= 30) {
      flags.push(flag('bmi', 'medium', 'Obesity range', `Calculated BMI ${bmi}.`, 'Consider lifestyle counselling and cardiometabolic screening.', `BMI ${bmi}`));
    } else if (bmi >= 25) {
      flags.push(flag('bmi', 'low', 'Overweight range', `Calculated BMI ${bmi}.`, 'Consider diet and activity advice.', `BMI ${bmi}`));
    } else if (bmi < 18.5) {
      flags.push(flag('bmi', 'low', 'Underweight range', `Calculated BMI ${bmi}.`, 'Consider nutritional assessment.', `BMI ${bmi}`));
    }
  }

  // Combination worth surfacing on its own
  const highBp = flags.find((f) => f.id === 'bp' && (f.severity === 'high' || f.severity === 'medium'));
  const highGlucose = flags.find((f) => f.id === 'glucose' && f.severity !== 'low');
  if (highBp && highGlucose) {
    flags.push(flag('combo', 'high', 'Raised blood pressure and blood glucose together', 'Both readings are outside the expected range.', 'Consider a combined cardiovascular and metabolic risk review.', 'BP + glucose'));
  }

  const hasVitals = !!(bp || hr || glucose || bmi);
  if (!hasVitals) {
    flags.push(flag('no-data', 'info', 'No vitals on file', 'The patient has not recorded any vitals yet.', 'Consider asking the patient to update their health profile before the visit.', null));
  }

  if (profile.allergies) {
    flags.push(flag('allergies', 'info', 'Allergies recorded', String(profile.allergies), 'Check against any planned prescriptions.', null));
  }
  if (profile.medicalConditions) {
    flags.push(flag('conditions', 'info', 'Known conditions', String(profile.medicalConditions), 'Review alongside the current readings.', null));
  }

  flags.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  const clinical = flags.filter((f) => f.severity !== 'info');
  const risk = clinical.length ? clinical[0].severity : hasVitals ? 'none' : 'unknown';
  return { flags, risk, bmi: bmi || null, hasVitals };
}
