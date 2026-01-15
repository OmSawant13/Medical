from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from datetime import datetime
from collections import defaultdict
from openai import OpenAI, RateLimitError, AuthenticationError
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Enhanced Medical Knowledge Base with confidence scores, reasoning, and treatments
MEDICAL_KNOWLEDGE_BASE = {
    "fever": {
        "conditions": {
            "Common Cold": {
                "confidence_base": 35,
                "symptom_weight": 30,
                "reasoning": "Fever is a common symptom of viral upper respiratory infections",
                "treatments": [
                    "Rest and adequate hydration (8-10 glasses of water daily)",
                    "Over-the-counter fever reducers: Acetaminophen (500-1000mg every 4-6 hours) or Ibuprofen (200-400mg every 4-6 hours)",
                    "Warm salt water gargles for throat irritation",
                    "Steam inhalation to relieve congestion",
                    "Vitamin C supplements (1000mg daily) to support immune system"
                ],
                "duration": "Typically resolves in 7-10 days"
            },
            "Influenza (Flu)": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "High fever (often 100-104°F) is characteristic of influenza",
                "treatments": [
                    "Antiviral medication (Oseltamivir/Tamiflu) if started within 48 hours of symptoms",
                    "Rest and hydration - drink plenty of fluids",
                    "Fever management: Acetaminophen or Ibuprofen",
                    "Warm baths or cold compresses for comfort",
                    "Avoid spreading: Stay home, cover coughs, wash hands frequently"
                ],
                "duration": "Symptoms peak in 2-3 days, recovery in 5-7 days"
            },
            "COVID-19": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Fever is a primary symptom of COVID-19 infection",
                "treatments": [
                    "Isolate immediately to prevent transmission",
                    "Get tested for COVID-19 (PCR or rapid antigen test)",
                    "Symptomatic treatment: Acetaminophen for fever",
                    "Monitor oxygen levels with pulse oximeter (seek help if <94%)",
                    "Rest, hydration, and nutritious meals",
                    "Consult healthcare provider for antiviral treatment options (Paxlovid) if eligible"
                ],
                "duration": "Isolation for 5 days minimum, symptoms may last 7-14 days"
            },
            "Bacterial Infection": {
                "confidence_base": 25,
                "symptom_weight": 25,
                "reasoning": "Persistent high fever may indicate bacterial infection requiring antibiotics",
                "treatments": [
                    "Medical evaluation required - may need antibiotic treatment",
                    "Fever management with Acetaminophen",
                    "Adequate rest and hydration",
                    "Do NOT use antibiotics without prescription"
                ],
                "duration": "Depends on infection type and treatment"
            }
        },
        "urgency": "consult_doctor"
    },
    "headache": {
        "conditions": {
            "Tension Headache": {
                "confidence_base": 45,
                "symptom_weight": 40,
                "reasoning": "Most common type of headache, often described as pressure or tightness",
                "treatments": [
                    "Over-the-counter pain relievers: Ibuprofen (400-600mg) or Acetaminophen (500-1000mg)",
                    "Apply cold or warm compress to forehead or neck",
                    "Gentle neck and shoulder stretches",
                    "Relaxation techniques: Deep breathing, meditation",
                    "Ensure adequate sleep (7-9 hours)",
                    "Stay hydrated (dehydration can trigger headaches)",
                    "Limit screen time and take regular breaks"
                ],
                "duration": "Usually resolves within hours to 1 day"
            },
            "Migraine": {
                "confidence_base": 35,
                "symptom_weight": 35,
                "reasoning": "Severe, throbbing headache often with sensitivity to light/sound",
                "treatments": [
                    "Migraine-specific medications: Triptans (Sumatriptan) if prescribed",
                    "Pain relievers: Ibuprofen or Naproxen at onset",
                    "Rest in dark, quiet room",
                    "Cold compress on forehead or back of neck",
                    "Caffeine in moderation (can help or worsen - know your trigger)",
                    "Preventive: Identify and avoid triggers (stress, certain foods, hormonal changes)",
                    "Magnesium supplements (400-500mg daily) may help prevent migraines"
                ],
                "duration": "Can last 4-72 hours if untreated"
            },
            "Sinusitis": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Headache with facial pressure, especially around eyes and cheeks",
                "treatments": [
                    "Nasal saline irrigation (neti pot) 2-3 times daily",
                    "Steam inhalation to reduce congestion",
                    "Decongestants: Pseudoephedrine (if no contraindications)",
                    "Pain relievers: Ibuprofen or Acetaminophen",
                    "Warm compress over sinuses",
                    "Stay hydrated to thin mucus",
                    "If bacterial: May require antibiotics (prescription needed)"
                ],
                "duration": "Acute: 7-10 days, Chronic: >12 weeks"
            },
            "Dehydration": {
                "confidence_base": 25,
                "symptom_weight": 25,
                "reasoning": "Headache is a common sign of inadequate fluid intake",
                "treatments": [
                    "Immediate: Drink water or electrolyte solution (Pedialyte, Gatorade)",
                    "Aim for 8-10 glasses of water daily",
                    "Avoid alcohol and excessive caffeine",
                    "Eat water-rich foods (fruits, vegetables)",
                    "Monitor urine color (should be light yellow)"
                ],
                "duration": "Resolves within hours of proper hydration"
            }
        },
        "urgency": "monitor"
    },
    "cough": {
        "conditions": {
            "Common Cold": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Cough is a primary symptom of upper respiratory viral infection",
                "treatments": [
                    "Cough suppressants: Dextromethorphan for dry cough",
                    "Expectorants: Guaifenesin for productive cough",
                    "Honey (1-2 teaspoons) - effective natural cough suppressant",
                    "Warm tea with lemon and honey",
                    "Steam inhalation to soothe airways",
                    "Stay hydrated to thin mucus",
                    "Avoid irritants: smoke, dust, strong perfumes"
                ],
                "duration": "Usually resolves in 7-14 days"
            },
            "Bronchitis": {
                "confidence_base": 35,
                "symptom_weight": 35,
                "reasoning": "Persistent cough with mucus production indicates lower respiratory involvement",
                "treatments": [
                    "Expectorants: Guaifenesin to help clear mucus",
                    "Steam inhalation and humidifier use",
                    "Adequate rest and hydration",
                    "Avoid smoking and secondhand smoke",
                    "If bacterial: Antibiotics may be prescribed",
                    "Cough may persist 2-3 weeks even after infection clears"
                ],
                "duration": "Acute: 1-3 weeks, may have lingering cough"
            },
            "Pneumonia": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Severe cough with fever and difficulty breathing suggests lung infection",
                "treatments": [
                    "MEDICAL EVALUATION REQUIRED - may need chest X-ray",
                    "Antibiotics if bacterial (prescription required)",
                    "Rest and adequate hydration",
                    "Oxygen therapy if needed (hospital setting)",
                    "Pain management for chest discomfort",
                    "Monitor breathing - seek emergency care if severe"
                ],
                "duration": "Treatment: 5-7 days, full recovery: 2-3 weeks"
            },
            "Asthma": {
                "confidence_base": 25,
                "symptom_weight": 25,
                "reasoning": "Chronic cough, especially at night or with exercise, may indicate asthma",
                "treatments": [
                    "Inhalers: Bronchodilators (Albuterol) for quick relief",
                    "Controller medications: Inhaled corticosteroids (prescription)",
                    "Identify and avoid triggers (allergens, exercise, cold air)",
                    "Peak flow monitoring if diagnosed",
                    "Medical management plan required"
                ],
                "duration": "Chronic condition requiring ongoing management"
            }
        },
        "urgency": "consult_doctor"
    },
    "chest pain": {
        "conditions": {
            "GERD (Acid Reflux)": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Chest pain after eating or when lying down often indicates acid reflux",
                "treatments": [
                    "Antacids: Tums, Rolaids for immediate relief",
                    "H2 blockers: Famotidine (Pepcid) or Ranitidine",
                    "Proton pump inhibitors: Omeprazole (Prilosec) for persistent symptoms",
                    "Avoid trigger foods: Spicy, fatty, acidic foods, caffeine, alcohol",
                    "Eat smaller meals, avoid eating 2-3 hours before bed",
                    "Elevate head of bed 6-8 inches",
                    "Lose weight if overweight (reduces pressure on stomach)"
                ],
                "duration": "Acute episodes: hours, Chronic: requires lifestyle management"
            },
            "Anxiety/Panic Attack": {
                "confidence_base": 35,
                "symptom_weight": 30,
                "reasoning": "Chest tightness with rapid heartbeat and shortness of breath suggests anxiety",
                "treatments": [
                    "Deep breathing exercises: 4-7-8 technique (inhale 4, hold 7, exhale 8)",
                    "Grounding techniques: 5-4-3-2-1 method (identify 5 things you see, etc.)",
                    "Progressive muscle relaxation",
                    "Avoid caffeine and stimulants",
                    "Regular exercise and stress management",
                    "Cognitive behavioral therapy (CBT) for chronic anxiety",
                    "If severe: Consult mental health professional"
                ],
                "duration": "Panic attacks: 10-30 minutes, Chronic: requires management"
            },
            "Muscle Strain": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Chest pain worsened by movement or breathing suggests musculoskeletal issue",
                "treatments": [
                    "Rest the affected area",
                    "Ice pack for first 48 hours (15-20 minutes, 3-4 times daily)",
                    "Heat therapy after 48 hours",
                    "Over-the-counter pain relievers: Ibuprofen (400-600mg) or Acetaminophen",
                    "Gentle stretching once pain subsides",
                    "Avoid activities that worsen pain"
                ],
                "duration": "Usually resolves in 3-7 days with rest"
            },
            "Heart Attack": {
                "confidence_base": 20,
                "symptom_weight": 20,
                "reasoning": "Severe chest pain with pressure, radiating to arm/jaw requires IMMEDIATE evaluation",
                "treatments": [
                    "🚨 CALL EMERGENCY SERVICES IMMEDIATELY (911/112)",
                    "Do NOT drive yourself to hospital",
                    "Chew aspirin (325mg) if not allergic and no contraindications",
                    "Stay calm and rest while waiting for help",
                    "Do NOT delay - time is critical for heart muscle preservation"
                ],
                "duration": "EMERGENCY - requires immediate medical intervention"
            }
        },
        "urgency": "emergency"
    },
    "nausea": {
        "conditions": {
            "Gastroenteritis": {
                "confidence_base": 45,
                "symptom_weight": 40,
                "reasoning": "Nausea with vomiting and/or diarrhea indicates stomach inflammation",
                "treatments": [
                    "Stay hydrated: Sip clear fluids (water, electrolyte solutions) frequently",
                    "BRAT diet: Bananas, Rice, Applesauce, Toast (bland foods)",
                    "Ginger: Ginger tea or ginger candies can reduce nausea",
                    "Avoid: Dairy, fatty foods, spicy foods, caffeine, alcohol",
                    "Rest and allow stomach to settle",
                    "If severe vomiting: Seek medical care for IV fluids"
                ],
                "duration": "Usually resolves in 24-48 hours"
            },
            "Food Poisoning": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Sudden onset nausea/vomiting after eating suggests foodborne illness",
                "treatments": [
                    "Hydration is critical: Small sips of water or electrolyte solution",
                    "Activated charcoal may help (consult pharmacist)",
                    "Rest and avoid food until nausea subsides",
                    "Gradually reintroduce bland foods",
                    "If severe or persistent >24 hours: Seek medical attention",
                    "Prevent spread: Wash hands thoroughly, don't prepare food for others"
                ],
                "duration": "Typically 1-3 days"
            },
            "Migraine": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Nausea often accompanies severe headaches in migraines",
                "treatments": [
                    "Treat underlying migraine: Triptans or pain relievers",
                    "Ginger tea or candies for nausea",
                    "Rest in dark, quiet room",
                    "Stay hydrated with small sips",
                    "Avoid triggers that cause migraines"
                ],
                "duration": "Resolves with migraine treatment"
            }
        },
        "urgency": "consult_doctor"
    },
    "fatigue": {
        "conditions": {
            "Anemia": {
                "confidence_base": 35,
                "symptom_weight": 30,
                "reasoning": "Persistent fatigue with weakness may indicate low red blood cell count",
                "treatments": [
                    "Iron supplements: Ferrous sulfate (65mg elemental iron daily) - take with vitamin C",
                    "Iron-rich foods: Red meat, spinach, lentils, fortified cereals",
                    "Vitamin B12 if deficient (supplement or injections)",
                    "Folate-rich foods: Leafy greens, beans, citrus fruits",
                    "Medical evaluation for underlying cause",
                    "Avoid tea/coffee with iron-rich meals (reduces absorption)"
                ],
                "duration": "Improvement in 2-4 weeks, full recovery: 2-3 months"
            },
            "Sleep Disorder": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Chronic fatigue often relates to poor sleep quality or quantity",
                "treatments": [
                    "Sleep hygiene: Consistent sleep schedule (same bedtime/wake time)",
                    "Create sleep-friendly environment: Dark, cool, quiet room",
                    "Avoid screens 1 hour before bed",
                    "Limit caffeine after 2 PM",
                    "Regular exercise (but not close to bedtime)",
                    "Relaxation techniques before bed",
                    "If persists: Consider sleep study for sleep apnea"
                ],
                "duration": "Improvement within 1-2 weeks of good sleep habits"
            },
            "Thyroid Issues": {
                "confidence_base": 30,
                "symptom_weight": 25,
                "reasoning": "Persistent fatigue with other symptoms may indicate thyroid dysfunction",
                "treatments": [
                    "Medical evaluation required: Blood tests (TSH, T3, T4)",
                    "Thyroid hormone replacement if hypothyroid (prescription)",
                    "Iodine-rich foods: Seafood, dairy, iodized salt",
                    "Selenium: Brazil nuts, tuna (supports thyroid function)",
                    "Regular monitoring and medication adjustment as needed"
                ],
                "duration": "Requires ongoing medical management"
            }
        },
        "urgency": "consult_doctor"
    },
    "joint pain": {
        "conditions": {
            "Osteoarthritis": {
                "confidence_base": 45,
                "symptom_weight": 40,
                "reasoning": "Joint pain, especially in knees, worsened by activity and improved with rest, suggests wear-and-tear arthritis",
                "treatments": [
                    "Pain management: Acetaminophen (500-1000mg every 4-6 hours) or Ibuprofen (400-600mg every 6-8 hours)",
                    "Topical treatments: Capsaicin cream or NSAID gels applied to affected joint",
                    "Physical therapy: Strengthening exercises for surrounding muscles",
                    "Weight management: Losing weight reduces stress on weight-bearing joints",
                    "Low-impact exercise: Swimming, cycling, walking (avoid high-impact activities)",
                    "Heat/cold therapy: Warm compress for stiffness, cold pack for acute pain",
                    "Assistive devices: Knee braces, canes, or orthotics if needed",
                    "Glucosamine and chondroitin supplements (may help some people)"
                ],
                "duration": "Chronic condition - symptoms can be managed but condition is progressive"
            },
            "Rheumatoid Arthritis": {
                "confidence_base": 35,
                "symptom_weight": 35,
                "reasoning": "Joint pain with swelling and morning stiffness suggests inflammatory arthritis",
                "treatments": [
                    "Medical evaluation required: Blood tests (RF, anti-CCP) and imaging",
                    "Disease-modifying antirheumatic drugs (DMARDs) - prescription required",
                    "NSAIDs: Ibuprofen or Naproxen for pain and inflammation",
                    "Corticosteroids: Short-term use for flare-ups (prescription)",
                    "Rest during flare-ups, gentle exercise during remission",
                    "Physical and occupational therapy",
                    "Anti-inflammatory diet: Omega-3 rich foods, reduce processed foods"
                ],
                "duration": "Chronic autoimmune condition requiring ongoing management"
            },
            "Injury/Strain": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Joint pain after activity or trauma suggests musculoskeletal injury",
                "treatments": [
                    "RICE protocol: Rest, Ice (15-20 min, 3-4x daily), Compression, Elevation",
                    "Pain relievers: Ibuprofen (400-600mg) or Acetaminophen",
                    "Avoid activities that worsen pain",
                    "Gradual return to activity once pain subsides",
                    "Physical therapy if pain persists >1 week",
                    "If severe: Medical evaluation for possible fracture or ligament tear"
                ],
                "duration": "Acute: 3-7 days, Chronic: may require medical evaluation"
            },
            "Bursitis": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Joint pain with localized swelling suggests inflammation of bursa sac",
                "treatments": [
                    "Rest the affected joint",
                    "Ice application: 15-20 minutes, 3-4 times daily",
                    "NSAIDs: Ibuprofen (400-600mg) for pain and inflammation",
                    "Avoid repetitive activities that caused the condition",
                    "Cushioning: Use knee pads or padding if kneeling",
                    "If severe: May require corticosteroid injection (medical procedure)"
                ],
                "duration": "Usually resolves in 1-2 weeks with proper treatment"
            }
        },
        "urgency": "consult_doctor"
    },
    "swelling": {
        "conditions": {
            "Inflammation": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Swelling is a sign of inflammation, often accompanying injury or infection",
                "treatments": [
                    "RICE protocol: Rest, Ice (15-20 min every 2-3 hours), Compression (elastic bandage), Elevation",
                    "NSAIDs: Ibuprofen (400-600mg) or Naproxen (220-440mg) to reduce inflammation",
                    "Keep affected area elevated above heart level when possible",
                    "Avoid heat initially (use cold for first 48 hours)",
                    "Gradual movement once swelling decreases",
                    "If severe or persistent: Medical evaluation to rule out infection or serious injury"
                ],
                "duration": "Acute: 3-7 days, depends on underlying cause"
            },
            "Arthritis": {
                "confidence_base": 35,
                "symptom_weight": 30,
                "reasoning": "Joint swelling with pain suggests arthritis (osteoarthritis or rheumatoid)",
                "treatments": [
                    "Anti-inflammatory medications: Ibuprofen or Naproxen",
                    "Cold packs to reduce swelling (15-20 minutes, 3-4x daily)",
                    "Rest the affected joint",
                    "Elevation to help reduce fluid accumulation",
                    "Medical evaluation for proper diagnosis and treatment plan",
                    "If rheumatoid: May require prescription medications"
                ],
                "duration": "Depends on type - acute flare-ups: days to weeks, chronic: ongoing"
            },
            "Infection": {
                "confidence_base": 30,
                "symptom_weight": 25,
                "reasoning": "Swelling with warmth, redness, and fever may indicate infection",
                "treatments": [
                    "MEDICAL EVALUATION REQUIRED - may need antibiotics",
                    "Do NOT delay if signs of infection: warmth, redness, fever, pus",
                    "Keep area clean and covered",
                    "Elevation and rest",
                    "If severe: Seek immediate medical attention"
                ],
                "duration": "Requires medical treatment - duration depends on infection type"
            }
        },
        "urgency": "consult_doctor"
    },
    "abdominal pain": {
        "conditions": {
            "Gastritis": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Abdominal pain, especially upper abdomen, often indicates stomach inflammation",
                "treatments": [
                    "Antacids: Tums, Rolaids for immediate relief",
                    "H2 blockers: Famotidine (Pepcid) 20mg twice daily",
                    "Proton pump inhibitors: Omeprazole (Prilosec) 20mg daily",
                    "Avoid irritants: Spicy foods, alcohol, NSAIDs, caffeine",
                    "Eat smaller, more frequent meals",
                    "Avoid eating 2-3 hours before bed",
                    "If persistent: Medical evaluation for H. pylori testing"
                ],
                "duration": "Acute: 3-7 days, Chronic: requires lifestyle changes"
            },
            "Irritable Bowel Syndrome": {
                "confidence_base": 35,
                "symptom_weight": 30,
                "reasoning": "Recurrent abdominal pain with changes in bowel habits suggests IBS",
                "treatments": [
                    "FODMAP diet: Reduce fermentable carbohydrates (under guidance)",
                    "Fiber supplements: Psyllium (Metamucil) gradually increase",
                    "Probiotics: May help some individuals",
                    "Stress management: Meditation, yoga, therapy",
                    "Regular exercise",
                    "Peppermint oil capsules (enteric-coated) may help",
                    "Medical evaluation for proper diagnosis"
                ],
                "duration": "Chronic condition requiring ongoing management"
            },
            "Appendicitis": {
                "confidence_base": 25,
                "symptom_weight": 20,
                "reasoning": "Severe right lower abdominal pain with nausea may indicate appendicitis",
                "treatments": [
                    "🚨 SEEK IMMEDIATE MEDICAL ATTENTION",
                    "Do NOT take pain medications that mask symptoms",
                    "Do NOT eat or drink (in case surgery is needed)",
                    "Go to emergency room immediately",
                    "This is a medical emergency requiring surgical evaluation"
                ],
                "duration": "EMERGENCY - requires immediate medical intervention"
            }
        },
        "urgency": "consult_doctor"
    },
    "dizziness": {
        "conditions": {
            "Dehydration": {
                "confidence_base": 40,
                "symptom_weight": 35,
                "reasoning": "Dizziness often indicates inadequate fluid intake",
                "treatments": [
                    "Immediate: Drink water or electrolyte solution (Pedialyte, Gatorade)",
                    "Aim for 8-10 glasses of water daily",
                    "Avoid alcohol and excessive caffeine",
                    "Eat water-rich foods: Fruits, vegetables",
                    "Rest in cool environment",
                    "Monitor urine color (should be light yellow)"
                ],
                "duration": "Resolves within hours of proper hydration"
            },
            "Low Blood Pressure": {
                "confidence_base": 35,
                "symptom_weight": 30,
                "reasoning": "Dizziness, especially when standing, suggests blood pressure drop",
                "treatments": [
                    "Rise slowly from sitting/lying position",
                    "Increase salt intake (if no contraindications)",
                    "Stay hydrated",
                    "Wear compression stockings if needed",
                    "Medical evaluation to rule out underlying causes",
                    "Avoid hot showers/baths that can lower BP"
                ],
                "duration": "Depends on cause - may be chronic or acute"
            },
            "Inner Ear Problem": {
                "confidence_base": 30,
                "symptom_weight": 30,
                "reasoning": "Dizziness with vertigo (spinning sensation) suggests inner ear issue",
                "treatments": [
                    "Epley maneuver for BPPV (benign paroxysmal positional vertigo)",
                    "Avoid sudden head movements",
                    "Medications: Meclizine (Antivert) or Dramamine for motion sickness",
                    "Stay hydrated",
                    "Rest during episodes",
                    "Medical evaluation for proper diagnosis"
                ],
                "duration": "Acute episodes: minutes to hours, may recur"
            }
        },
        "urgency": "consult_doctor"
    },
    "flank pain": {
        "conditions": {
            "Kidney Stones": {
                "confidence_base": 70,
                "symptom_weight": 65,
                "reasoning": "Severe flank pain, especially with blood in urine, is classic presentation of kidney stones",
                "treatments": [
                    "🚨 IMMEDIATE MEDICAL ATTENTION REQUIRED",
                    "Pain management: Strong pain relievers (may need prescription - Toradol, Morphine)",
                    "Hydration: Drink 2-3 liters of water daily to help pass stone",
                    "Medical evaluation: CT scan or ultrasound to confirm stone location and size",
                    "If stone <5mm: Usually passes with hydration and pain management",
                    "If stone >5mm: May require lithotripsy (shock wave therapy) or surgical removal",
                    "Monitor for signs of infection: Fever, chills, worsening pain"
                ],
                "duration": "Acute pain: hours to days, stone passage: 1-4 weeks"
            },
            "Urinary Tract Infection (UTI)": {
                "confidence_base": 50,
                "symptom_weight": 45,
                "reasoning": "Flank pain with blood in urine suggests upper UTI (pyelonephritis) affecting kidneys",
                "treatments": [
                    "MEDICAL EVALUATION REQUIRED - may need antibiotics",
                    "Urine culture to identify bacteria",
                    "Antibiotics: Usually Ciprofloxacin, Levofloxacin, or Trimethoprim-Sulfamethoxazole (prescription required)",
                    "Hydration: Drink plenty of water",
                    "Pain management: Ibuprofen (400-600mg) for pain and inflammation",
                    "If severe: May require IV antibiotics in hospital",
                    "Complete full course of antibiotics even if symptoms improve"
                ],
                "duration": "Treatment: 7-14 days, symptoms improve in 24-48 hours with antibiotics"
            },
            "Kidney Infection (Pyelonephritis)": {
                "confidence_base": 60,
                "symptom_weight": 55,
                "reasoning": "Severe flank pain with blood in urine and nausea indicates kidney infection",
                "treatments": [
                    "🚨 IMMEDIATE MEDICAL ATTENTION - can be serious",
                    "Medical evaluation: Urine culture, blood tests, imaging",
                    "Antibiotics: Usually IV antibiotics initially (hospital setting)",
                    "Pain management: Prescription pain medications",
                    "Hydration: IV fluids if severe",
                    "Hospitalization may be required for severe cases",
                    "Monitor for sepsis signs: High fever, rapid heart rate, confusion"
                ],
                "duration": "Hospital treatment: 2-3 days, oral antibiotics: 10-14 days"
            }
        },
        "urgency": "emergency"
    },
    "blood in urine": {
        "conditions": {
            "Kidney Stones": {
                "confidence_base": 75,
                "symptom_weight": 70,
                "reasoning": "Blood in urine with flank pain is highly suggestive of kidney stones",
                "treatments": [
                    "🚨 IMMEDIATE MEDICAL EVALUATION REQUIRED",
                    "Medical imaging: CT scan or ultrasound to locate stones",
                    "Pain management: Strong analgesics (prescription required)",
                    "Hydration: 2-3 liters water daily",
                    "Stone removal: Depends on size - may need lithotripsy or surgery",
                    "Monitor for complications: Infection, obstruction"
                ],
                "duration": "Depends on stone size and treatment method"
            },
            "Urinary Tract Infection": {
                "confidence_base": 60,
                "symptom_weight": 55,
                "reasoning": "Blood in urine with pain suggests UTI, especially if upper tract involved",
                "treatments": [
                    "MEDICAL EVALUATION REQUIRED",
                    "Urine culture and sensitivity testing",
                    "Antibiotics: Prescription required (Ciprofloxacin, Levofloxacin, etc.)",
                    "Hydration: Increase fluid intake",
                    "Pain relief: Ibuprofen (400-600mg every 6-8 hours)",
                    "Complete full antibiotic course"
                ],
                "duration": "Antibiotic course: 7-14 days"
            },
            "Bladder/Kidney Cancer": {
                "confidence_base": 25,
                "symptom_weight": 20,
                "reasoning": "Blood in urine without infection requires evaluation to rule out malignancy",
                "treatments": [
                    "🚨 URGENT MEDICAL EVALUATION REQUIRED",
                    "Imaging: CT scan, cystoscopy, ultrasound",
                    "Urine cytology to check for cancer cells",
                    "Biopsy if suspicious findings",
                    "Treatment depends on diagnosis and staging",
                    "Do NOT delay evaluation - early detection is critical"
                ],
                "duration": "Requires immediate medical workup"
            }
        },
        "urgency": "emergency"
    }
}

# Symptom synonyms for better matching - expanded list
SYMPTOM_SYNONYMS = {
    "fever": ["fever", "temperature", "high temp", "hot body", "febrile", "have fever", "running fever", "feverish", "temp", "high temperature", "fever and", "got fever", "body burning"],
    "headache": ["headache", "head pain", "head ache", "migraine", "head pounding", "head hurts", "head hurting", "pain in head", "head throbbing", "headache and"],
    "cough": ["cough", "coughing", "hack", "hacking", "coughing and", "have cough", "got cough", "persistent cough"],
    "chest pain": ["chest pain", "chest discomfort", "chest tightness", "heart pain", "chest ache", "pain in chest", "pain in my chest", "chest hurts", "chest hurting", "tight chest", "heartburn", "acid reflux", "gerd", "chest burning", "burning in chest", "burning in my chest", "burning sensation in chest", "burning sensation in my chest", "burning sensation", "chest on fire", "burning chest"],
    "sour taste": ["sour taste", "sour taste in mouth", "acidic taste", "bitter taste", "metallic taste", "bad taste mouth", "sour mouth"],
    "nausea": ["nausea", "nauseous", "queasy", "sick to stomach", "feeling sick", "feel nauseous", "feeling nauseous", "want to vomit", "feeling queasy"],
    "fatigue": ["fatigue", "tired", "exhausted", "weak", "low energy", "lethargic", "worn out", "feeling tired", "very tired", "extreme fatigue", "no energy", "lack of energy"],
    "joint pain": ["joint pain", "knee pain", "knee hurts", "knee hurting", "pain in knee", "knee ache", "elbow pain", "shoulder pain", "hip pain", "wrist pain", "ankle pain", "joints hurt", "joints hurting", "arthritis pain", "painful joints"],
    "swelling": ["swelling", "swollen", "swell", "inflammation", "inflamed", "puffy", "puffiness", "edema", "swollen knee", "swollen joint", "knee swelling", "joint swelling"],
    "abdominal pain": ["abdominal pain", "stomach pain", "belly pain", "stomach ache", "stomach hurts", "pain in stomach", "abdominal discomfort", "tummy pain", "belly ache"],
    "dizziness": ["dizziness", "dizzy", "feeling dizzy", "lightheaded", "light headed", "vertigo", "feeling faint", "woozy"],
    "flank pain": ["flank pain", "flank hurts", "side pain", "pain in side", "lower back pain", "back pain", "kidney pain", "renal pain", "severe flank pain"],
    "blood in urine": ["blood in urine", "bloody urine", "hematuria", "urine with blood", "red urine", "pink urine", "blood when urinating", "bloody pee"],
    "abdominal pain": ["abdominal pain", "stomach pain", "belly pain", "stomach ache", "stomach hurts", "pain in stomach", "abdominal discomfort", "tummy pain", "belly ache"]
}

def calculate_confidence(condition_data, matched_symptoms_count, total_symptoms):
    """
    Calculate confidence score for a condition based on symptom matches
    """
    base_confidence = condition_data["confidence_base"]
    symptom_weight = condition_data["symptom_weight"]
    
    # Increase confidence based on number of matching symptoms
    match_bonus = (matched_symptoms_count / max(total_symptoms, 1)) * 30
    
    # Calculate final confidence (capped at 95%)
    confidence = min(base_confidence + match_bonus, 95)
    
    return round(confidence, 1)

def analyze_symptoms(symptoms_text):
    """
    Enhanced symptom analysis with confidence scoring, reasoning, and treatments
    """
    symptoms_lower = symptoms_text.lower().strip()
    detected_symptoms = []
    condition_scores = defaultdict(lambda: {"confidence": 0, "matched_symptoms": [], "data": None})
    
    # Detect symptoms using synonyms - prioritize critical symptoms first
    # Sort symptoms by urgency (emergency symptoms first)
    symptom_priority = []
    for symptom_key, synonyms in SYMPTOM_SYNONYMS.items():
        urgency = "monitor"
        if symptom_key in MEDICAL_KNOWLEDGE_BASE:
            urgency = MEDICAL_KNOWLEDGE_BASE[symptom_key].get("urgency", "monitor")
        priority = 0 if urgency == "emergency" else (1 if urgency == "consult_doctor" else 2)
        symptom_priority.append((priority, symptom_key, synonyms))
    
    # Sort by priority (emergency first)
    symptom_priority.sort(key=lambda x: x[0])
    
    # Detect symptoms - check critical ones first
    for priority, symptom_key, synonyms in symptom_priority:
        # Check each synonym - simple substring match (case-insensitive)
        for syn in synonyms:
            # Normalize both for comparison
            syn_lower = syn.lower().strip()
            if syn_lower and syn_lower in symptoms_lower:
                # Found a match for this symptom
                if symptom_key not in detected_symptoms:
                    detected_symptoms.append(symptom_key)
                    print(f"✅ Detected symptom: {symptom_key} (urgency: {MEDICAL_KNOWLEDGE_BASE.get(symptom_key, {}).get('urgency', 'monitor')})")
                
                # Get conditions for this symptom
                if symptom_key in MEDICAL_KNOWLEDGE_BASE:
                    symptom_data = MEDICAL_KNOWLEDGE_BASE[symptom_key]
                    
                    # Check if conditions exist and is a dict
                    if "conditions" in symptom_data and isinstance(symptom_data["conditions"], dict):
                        for condition_name, condition_data in symptom_data["conditions"].items():
                            if condition_name not in condition_scores:
                                condition_scores[condition_name] = {
                                    "confidence": 0,
                                    "matched_symptoms": [],
                                    "data": condition_data
                                }
                            
                            if symptom_key not in condition_scores[condition_name]["matched_symptoms"]:
                                condition_scores[condition_name]["matched_symptoms"].append(symptom_key)
                break  # Found match for this symptom, move to next symptom
    
    # Debug output
    print(f"DEBUG: Input text: '{symptoms_text}'")
    print(f"DEBUG: Detected symptoms: {detected_symptoms}")
    print(f"DEBUG: Condition scores count: {len(condition_scores)}")
    
    if not detected_symptoms:
        # Try one more time with a simpler approach - check if any symptom keyword exists directly
        simple_check = symptoms_lower
        for symptom_key in SYMPTOM_SYNONYMS.keys():
            if symptom_key in simple_check:
                detected_symptoms.append(symptom_key)
                print(f"DEBUG: Found via direct key match: {symptom_key}")
                # Get conditions
                if symptom_key in MEDICAL_KNOWLEDGE_BASE:
                    symptom_data = MEDICAL_KNOWLEDGE_BASE[symptom_key]
                    if "conditions" in symptom_data and isinstance(symptom_data["conditions"], dict):
                        for condition_name, condition_data in symptom_data["conditions"].items():
                            if condition_name not in condition_scores:
                                condition_scores[condition_name] = {
                                    "confidence": 0,
                                    "matched_symptoms": [],
                                    "data": condition_data
                                }
                            if symptom_key not in condition_scores[condition_name]["matched_symptoms"]:
                                condition_scores[condition_name]["matched_symptoms"].append(symptom_key)
                break
        
        if not detected_symptoms:
            return {
                "diagnosis": "I couldn't identify specific symptoms in your description. Please provide more details about what you're experiencing (e.g., 'I have a fever and headache').",
                "possible_conditions": [],
                "detected_symptoms": [],
                "urgency": "monitor",
                "recommendations": [
                    "Please describe your symptoms in more detail",
                    "Mention when symptoms started",
                    "Include any associated symptoms"
                ],
                "confidence_scores": {},
                "treatments": {},
                "timestamp": datetime.now().isoformat()
            }
    
    # Calculate confidence for each condition
    total_symptoms = len(detected_symptoms)
    for condition_name, condition_info in condition_scores.items():
        matched_count = len(condition_info["matched_symptoms"])
        confidence = calculate_confidence(
            condition_info["data"],
            matched_count,
            total_symptoms
        )
        condition_scores[condition_name]["confidence"] = confidence
    
    # Filter out low-confidence matches (<30%) and sort by confidence
    filtered_conditions = {
        name: info for name, info in condition_scores.items()
        if info["confidence"] >= 30
    }
    
    sorted_conditions = sorted(
        filtered_conditions.items(),
        key=lambda x: x[1]["confidence"],
        reverse=True
    )
    
    # Determine urgency level
    urgency_level = "monitor"
    for symptom in detected_symptoms:
        if symptom in MEDICAL_KNOWLEDGE_BASE:
            symptom_urgency = MEDICAL_KNOWLEDGE_BASE[symptom]["urgency"]
            if symptom_urgency == "emergency":
                urgency_level = "emergency"
                break
            elif symptom_urgency == "consult_doctor" and urgency_level != "emergency":
                urgency_level = "consult_doctor"
    
    # Build diagnosis response
    if not sorted_conditions:
        symptoms_str = ', '.join(detected_symptoms).title() if detected_symptoms else 'provided'
        diagnosis_text = f"Based on your symptoms ({symptoms_str}), I couldn't find strong matches (confidence < 30%). "
        diagnosis_text += "Please provide more specific symptoms or consult a healthcare professional for evaluation."
        treatments_dict = {}
        confidence_scores_dict = {}
    else:
        diagnosis_text = f"**Analysis of Symptoms:** {', '.join(detected_symptoms).title()}\n\n"
        diagnosis_text += "**Possible Conditions (Ranked by Confidence):**\n\n"
        
        for i, (condition_name, condition_info) in enumerate(sorted_conditions[:5], 1):
            confidence = condition_info["confidence"]
            reasoning = condition_info["data"]["reasoning"]
            matched_syms = condition_info["matched_symptoms"]
            
            diagnosis_text += f"**{i}. {condition_name}** - {confidence}% confidence\n"
            diagnosis_text += f"   • Why: {reasoning}\n"
            diagnosis_text += f"   • Matching symptoms: {', '.join(matched_syms).title()}\n\n"
        
        # Prepare treatments and confidence scores for response
        treatments_dict = {}
        confidence_scores_dict = {}
        
        for condition_name, condition_info in sorted_conditions[:5]:
            confidence_scores_dict[condition_name] = condition_info["confidence"]
            treatments_dict[condition_name] = {
                "treatments": condition_info["data"]["treatments"],
                "duration": condition_info["data"].get("duration", "Varies")
            }
    
    # Generate recommendations
    recommendations = []
    if urgency_level == "emergency":
        recommendations = [
            "🚨 SEEK IMMEDIATE MEDICAL ATTENTION",
            "Call emergency services (911/112) if symptoms are severe",
            "Do not delay - some conditions require immediate treatment"
        ]
    elif urgency_level == "consult_doctor":
        recommendations = [
            "Schedule an appointment with a healthcare provider for proper evaluation",
            "Monitor symptoms and track any changes",
            "Bring this analysis to your doctor for discussion"
        ]
    else:
        recommendations = [
            "Monitor your symptoms closely",
            "Try the suggested treatments for the top-ranked conditions",
            "If symptoms persist or worsen, consult a healthcare professional"
        ]
    
    return {
        "diagnosis": diagnosis_text,
        "possible_conditions": [name for name, _ in sorted_conditions[:5]] if sorted_conditions else [],
        "detected_symptoms": detected_symptoms,
        "urgency": urgency_level,
        "recommendations": recommendations,
        "confidence_scores": confidence_scores_dict,
        "treatments": treatments_dict,
        "timestamp": datetime.now().isoformat()
    }

def get_ai_complete_diagnosis(symptoms_text):
    """
    Complete AI-powered diagnosis - analyzes ALL symptoms together with medical logic
    No hardcoded matching - pure AI analysis of complete symptom picture
    """
    if not client:
        return {
            "diagnosis": "AI analysis not available. Please ensure OpenAI API is configured.",
            "possible_conditions": [],
            "detected_symptoms": [],
            "urgency": "monitor",
            "recommendations": ["Please consult a healthcare professional"],
            "confidence_scores": {},
            "treatments": {},
            "ai_enhanced": False,
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        prompt = f"""You are an expert medical AI assistant. Analyze the COMPLETE symptom picture with careful medical reasoning.

PATIENT SYMPTOMS: {symptoms_text}

CRITICAL: You MUST provide analysis for ANY symptoms provided. Even if symptoms are vague, provide your best medical assessment. NEVER say "I couldn't identify" - always analyze what the patient described.

CRITICAL THINKING PROCESS - Follow these steps:

STEP 1: Identify ALL symptoms mentioned
- List every symptom the patient described
- Don't miss any symptoms
- Don't add symptoms that weren't mentioned

STEP 2: Understand symptom relationships
- How do these symptoms relate to each other?
- Which symptoms are primary vs secondary?
- What symptom combinations suggest specific conditions?

STEP 3: Apply medical logic
- Use differential diagnosis principles
- Consider the MOST LIKELY conditions first
- Rule out conditions that don't fit the symptom pattern
- Think: "What condition explains ALL these symptoms together?"

STEP 4: Rank by probability
- Which condition best explains the complete symptom picture?
- Consider symptom severity, timing, and relationships
- Be conservative - if unsure, rank lower

STEP 5: Provide evidence-based reasoning
- Explain WHY each condition matches (or doesn't match)
- Reference specific symptoms that support each diagnosis
- Be logical and clear in your reasoning

CRITICAL EXAMPLES OF LOGICAL THINKING:
- "heartburn, chest burning, sour taste" → These are ALL gastrointestinal symptoms pointing to GERD. NOT fever (no temperature mentioned, no body aches).
- "severe flank pain, blood in urine, nausea" → Flank pain + hematuria = kidney issue. Nausea is secondary. NOT just gastroenteritis.
- "fever, headache, body aches" → Systemic symptoms = viral infection. NOT heartburn.

Provide analysis in this EXACT JSON format:
{{
  "detected_symptoms": ["symptom1", "symptom2"],
  "possible_conditions": [
    {{
      "name": "Condition Name",
      "confidence": 85,
      "reasoning": "Why this condition matches ALL symptoms together with medical logic"
    }}
  ],
  "treatments": {{
    "Condition Name": {{
      "treatments": ["Treatment 1 with dosage if applicable", "Treatment 2"],
      "duration": "Expected duration"
    }}
  }},
  "urgency": "emergency|consult_doctor|monitor",
  "recommendations": ["Recommendation 1"],
  "important_notes": ["Red flag symptoms to watch for"]
}}

STRICT REQUIREMENTS:
1. ALWAYS provide REAL analysis - NEVER say "I couldn't identify", "please provide more details", or "I've analyzed your symptoms. However, for accurate diagnosis..." - YOU MUST PROVIDE ACTUAL CONDITIONS AND REASONING
2. THINK LOGICALLY - Don't match keywords, understand meaning
3. Consider ALL symptoms together - don't focus on just one
4. Use differential diagnosis - what explains the COMPLETE picture?
5. Be CONSERVATIVE - if symptoms don't clearly point to a condition, rank it lower but still include it
6. Rank 3-5 most likely conditions by probability (include conditions even if confidence is 30-40% if they're possible)
7. Provide evidence-based treatments with specific dosages when applicable
8. ALWAYS include actual possible conditions - DO NOT just say "consult doctor" without providing analysis
9. Be ACCURATE - medical errors can be dangerous
10. If symptoms are vague, provide general analysis with possible conditions and recommend professional evaluation
11. CRITICAL: Your response MUST include a "possible_conditions" array with at least 2-3 conditions, even if confidence is low. NEVER return empty conditions.

THINK BEFORE RESPONDING:
- Does this condition explain ALL the symptoms?
- Are there symptoms that don't fit this condition?
- Is there a more likely explanation?
- Am I being logical or just matching keywords?
- Have I provided analysis for EVERYTHING the patient mentioned?
- Did I actually list possible conditions, or did I just say "consult doctor"?

CRITICAL: Your JSON response MUST have at least 2-3 conditions in "possible_conditions" array. If you cannot identify specific conditions, provide general categories (e.g., "Musculoskeletal issue", "Joint problem", "Inflammatory condition") with reasoning."""

        print(f"🤖 Analyzing COMPLETE symptoms with OpenAI GPT-4: '{symptoms_text}'")
        print(f"🔑 OpenAI client status: {'✅ Initialized' if client else '❌ Not initialized'}")
        print(f"🔑 API Key present: {'✅ Yes' if OPENAI_API_KEY else '❌ No'}")
        print(f"🔑 API Key preview: {OPENAI_API_KEY[:20]}..." if OPENAI_API_KEY else "No API key")
        
        if not client:
            raise Exception("OpenAI client not initialized - check API key")
        
        try:
            print("📡 Making OpenAI API call...")
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are an expert medical AI with strong analytical reasoning. You think step-by-step, use differential diagnosis, and apply medical logic carefully. You consider ALL symptoms together and their relationships. You are accurate and helpful. You don't match keywords - you understand meaning and context. You provide evidence-based information with actual possible conditions, treatments, and reasoning. You MUST always provide real medical analysis with specific conditions - never just say 'consult doctor' without analysis. Always emphasize this is informational only and not a medical diagnosis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Even lower temperature for more logical, consistent reasoning
                max_tokens=3500
            )
            
            ai_response = response.choices[0].message.content
            print(f"✅ OpenAI GPT-4 response received! Length: {len(ai_response)} chars")
            print(f"Response preview: {ai_response[:200]}...")
        except (RateLimitError, AuthenticationError) as auth_error:
            print(f"⚠️ OpenAI API Error (Quota/Auth): {auth_error}")
            print("🔄 Falling back to local knowledge base...")
            # Fallback to local analysis
            local_result = analyze_symptoms(symptoms_text)
            local_result["diagnosis"] = "**Note:** AI service unavailable (Quota Exceeded/Auth Error). Using local medical knowledge base.\n\n" + local_result["diagnosis"]
            local_result["ai_enhanced"] = False
            return local_result
        except Exception as api_error:
            print(f"❌ OpenAI API call failed: {api_error}")
            print(f"❌ Error type: {type(api_error).__name__}")
            import traceback
            traceback.print_exc()
            raise  # Re-raise to trigger retry logic
        
        # Parse JSON
        try:
            if "```json" in ai_response:
                json_start = ai_response.find("```json") + 7
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            elif "```" in ai_response:
                json_start = ai_response.find("```") + 3
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            
            ai_data = json.loads(ai_response)
            
            # Build diagnosis
            diagnosis_text = f"**Analysis of Symptoms:** {', '.join(ai_data.get('detected_symptoms', ['Provided symptoms'])).title()}\n\n"
            diagnosis_text += "**Possible Conditions (Ranked by Confidence):**\n\n"
            
            conditions = ai_data.get("possible_conditions", [])
            for i, cond in enumerate(conditions[:5], 1):
                confidence = cond.get("confidence", 0)
                reasoning = cond.get("reasoning", "")
                diagnosis_text += f"**{i}. {cond.get('name', 'Unknown')}** - {confidence}% confidence\n"
                diagnosis_text += f"   • Medical reasoning: {reasoning}\n\n"
            
            diagnosis_text += "\n⚠️ **IMPORTANT:** This is NOT a medical diagnosis. Please consult with a qualified healthcare professional for proper evaluation and treatment."
            
            return {
                "diagnosis": diagnosis_text,
                "possible_conditions": [c.get("name") for c in conditions],
                "detected_symptoms": ai_data.get("detected_symptoms", []),
                "urgency": ai_data.get("urgency", "monitor"),
                "recommendations": ai_data.get("recommendations", []) + ai_data.get("important_notes", []),
                "confidence_scores": {c.get("name"): c.get("confidence", 0) for c in conditions},
                "treatments": ai_data.get("treatments", {}),
                "ai_enhanced": True,
                "timestamp": datetime.now().isoformat()
            }
            
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parsing error: {e}")
            print(f"AI Response (first 500 chars): {ai_response[:500]}")
            # Even if JSON fails, use the AI text response - it's still valuable
            diagnosis_text = f"**AI Medical Analysis:**\n\n{ai_response}\n\n⚠️ This is for informational purposes only. Please consult a healthcare professional."
            
            # Try to extract some structure from text
            detected_symptoms = []
            possible_conditions = []
            
            # Extract symptoms mentioned
            if "symptom" in ai_response.lower():
                import re
                symptom_matches = re.findall(r'(?:symptom|experience|feeling|having)[:\s]+([a-z]+(?:\s+[a-z]+)*)', ai_response.lower())
                detected_symptoms = list(set(symptom_matches[:5]))
            
            # Extract condition names
            condition_matches = re.findall(r'(?:condition|diagnosis|may be|could be|suggests?|likely)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', ai_response)
            possible_conditions = list(set(condition_matches[:5]))
            
            return {
                "diagnosis": diagnosis_text,
                "possible_conditions": possible_conditions if possible_conditions else [],
                "detected_symptoms": detected_symptoms if detected_symptoms else symptoms_text.split()[:5],
                "urgency": "consult_doctor",
                "recommendations": ["Consult a healthcare professional", "Review the AI analysis above"],
                "confidence_scores": {},
                "treatments": {},
                "ai_enhanced": True,
                "timestamp": datetime.now().isoformat()
            }
        
    except Exception as e:
        print(f"❌ OpenAI error: {e}")
        # Even on error, provide AI-based analysis with a simpler prompt
        try:
            print("🔄 Retrying with simpler AI analysis...")
            simple_prompt = f"""Analyze these symptoms and provide medical analysis: {symptoms_text}

Provide JSON with:
- detected_symptoms: list all symptoms mentioned
- possible_conditions: [{{"name": "...", "confidence": X, "reasoning": "..."}}]
- treatments: {{"Condition": {{"treatments": [...], "duration": "..."}}}}
- urgency: "emergency|consult_doctor|monitor"
- recommendations: [...]

Be logical and analyze ALL symptoms together."""
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a medical AI. Analyze symptoms logically. Always provide analysis even for vague symptoms."},
                    {"role": "user", "content": simple_prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            ai_response = response.choices[0].message.content
            
            # Try to parse
            if "```json" in ai_response:
                json_start = ai_response.find("```json") + 7
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            elif "```" in ai_response:
                json_start = ai_response.find("```") + 3
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            
            ai_data = json.loads(ai_response)
            
            diagnosis_text = f"**Analysis of Symptoms:** {', '.join(ai_data.get('detected_symptoms', ['Symptoms provided'])).title()}\n\n"
            diagnosis_text += "**Possible Conditions:**\n\n"
            
            for i, cond in enumerate(ai_data.get("possible_conditions", [])[:5], 1):
                diagnosis_text += f"**{i}. {cond.get('name', 'Unknown')}** - {cond.get('confidence', 0)}% confidence\n"
                diagnosis_text += f"   • Reasoning: {cond.get('reasoning', '')}\n\n"
            
            return {
                "diagnosis": diagnosis_text,
                "possible_conditions": [c.get("name") for c in ai_data.get("possible_conditions", [])],
                "detected_symptoms": ai_data.get("detected_symptoms", []),
                "urgency": ai_data.get("urgency", "consult_doctor"),
                "recommendations": ai_data.get("recommendations", ["Consult a healthcare professional"]),
                "confidence_scores": {c.get("name"): c.get("confidence", 0) for c in ai_data.get("possible_conditions", [])},
                "treatments": ai_data.get("treatments", {}),
                "ai_enhanced": True,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e2:
            print(f"❌ Retry also failed: {e2}")
            import traceback
            traceback.print_exc()
            # Last resort - use AI with even simpler direct prompt
            if not client:
                print("❌ OpenAI client is None - cannot make AI calls")
                return {
                    "diagnosis": f"**Symptom Analysis:**\n\nYour symptoms: {symptoms_text}\n\n**Note:** AI analysis service is currently unavailable. Please consult with a healthcare professional for proper evaluation.\n\n⚠️ **This requires professional medical evaluation.**",
                    "possible_conditions": [],
                    "detected_symptoms": symptoms_text.split()[:5],
                    "urgency": "consult_doctor",
                    "recommendations": ["Consult a healthcare professional immediately"],
                    "confidence_scores": {},
                    "treatments": {},
                    "ai_enhanced": False,
                    "timestamp": datetime.now().isoformat()
                }
            try:
                if not client:
                    raise Exception("OpenAI client is None - cannot make final attempt")
                print("🔄 Final attempt with direct AI call...")
                direct_response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": "You are a medical AI. Always provide medical analysis for any symptoms. Never say you can't identify - always analyze."},
                        {"role": "user", "content": f"Analyze these symptoms medically: {symptoms_text}. Provide possible conditions, treatments, and urgency. Format as JSON with detected_symptoms, possible_conditions (name, confidence, reasoning), treatments, urgency, recommendations."}
                    ],
                    temperature=0.2,
                    max_tokens=2000
                )
                
                ai_text = direct_response.choices[0].message.content
                
                # Try to extract JSON or use text directly
                if "{" in ai_text and "}" in ai_text:
                    try:
                        if "```json" in ai_text:
                            json_part = ai_text[ai_text.find("```json")+7:ai_text.find("```", ai_text.find("```json")+7)].strip()
                        elif "```" in ai_text:
                            json_part = ai_text[ai_text.find("```")+3:ai_text.find("```", ai_text.find("```")+3)].strip()
                        else:
                            json_part = ai_text[ai_text.find("{"):ai_text.rfind("}")+1]
                        
                        ai_data = json.loads(json_part)
                        
                        diagnosis = f"**Analysis of Symptoms:** {', '.join(ai_data.get('detected_symptoms', ['Symptoms provided'])).title()}\n\n"
                        diagnosis += "**Possible Conditions:**\n\n"
                        
                        for i, cond in enumerate(ai_data.get("possible_conditions", [])[:5], 1):
                            diagnosis += f"**{i}. {cond.get('name', 'Unknown')}** - {cond.get('confidence', 0)}% confidence\n"
                            diagnosis += f"   • Reasoning: {cond.get('reasoning', '')}\n\n"
                        
                        return {
                            "diagnosis": diagnosis,
                            "possible_conditions": [c.get("name") for c in ai_data.get("possible_conditions", [])],
                            "detected_symptoms": ai_data.get("detected_symptoms", []),
                            "urgency": ai_data.get("urgency", "consult_doctor"),
                            "recommendations": ai_data.get("recommendations", ["Consult a healthcare professional"]),
                            "confidence_scores": {c.get("name"): c.get("confidence", 0) for c in ai_data.get("possible_conditions", [])},
                            "treatments": ai_data.get("treatments", {}),
                            "ai_enhanced": True,
                            "timestamp": datetime.now().isoformat()
                        }
                    except:
                        pass
                
                # If JSON parsing fails, use the text response directly
                return {
                    "diagnosis": f"**AI Medical Analysis:**\n\n{ai_text}\n\n⚠️ This is for informational purposes only. Please consult a healthcare professional.",
                    "possible_conditions": [],
                    "detected_symptoms": [],
                    "urgency": "consult_doctor",
                    "recommendations": ["Consult a healthcare professional"],
                    "confidence_scores": {},
                    "treatments": {},
                    "ai_enhanced": True,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e3:
                print(f"❌ All AI attempts failed: {e3}")
                import traceback
                traceback.print_exc()
                # This should NEVER happen if OpenAI is working - log the error
                print(f"🚨 CRITICAL: All AI analysis attempts failed for symptoms: {symptoms_text}")
                print(f"Error details: {str(e3)}")
                # Return error message that indicates AI failure
                return {
                    "diagnosis": f"**⚠️ AI Analysis Service Error:**\n\nI encountered an error while analyzing your symptoms: {symptoms_text}\n\n**Please try again, or consult a healthcare professional directly.**\n\n**Error Details:** The AI analysis service is currently unavailable. This may be due to:\n- Network connectivity issues\n- API service interruption\n- Configuration error\n\n**Recommendation:** Please consult with a healthcare professional for proper medical evaluation.\n\n⚠️ **This requires professional medical evaluation.**",
                    "possible_conditions": [],
                    "detected_symptoms": symptoms_text.split()[:5],
                    "urgency": "consult_doctor",
                    "recommendations": [
                        "Try refreshing and submitting your symptoms again",
                        "If the issue persists, consult a healthcare professional directly"
                    ],
                    "confidence_scores": {},
                    "treatments": {},
                    "ai_enhanced": False,
                    "timestamp": datetime.now().isoformat()
                }

def get_ai_enhanced_diagnosis(symptoms_text, detected_symptoms, base_analysis):
    """
    Use OpenAI GPT-4 to enhance medical diagnosis with better accuracy and reasoning
    """
    if not client:
        print("⚠️ OpenAI client not initialized - using base analysis only")
        return base_analysis
    
    print(f"🤖 Calling OpenAI GPT-4 API for symptoms: {detected_symptoms}")
    
    try:
        prompt = f"""You are a medical AI assistant. CRITICAL: Provide accurate, evidence-based medical information. This is for INFORMATIONAL PURPOSES ONLY - NOT a substitute for professional medical care.

Patient symptoms: {symptoms_text}
Detected symptom categories: {', '.join(detected_symptoms) if detected_symptoms else 'General symptoms'}

Analyze and provide a structured response in JSON format:

{{
  "possible_conditions": [
    {{
      "name": "Condition Name",
      "confidence": 75,
      "reasoning": "Why this condition matches the symptoms"
    }}
  ],
  "treatments": {{
    "Condition Name": {{
      "treatments": ["Treatment 1", "Treatment 2"],
      "duration": "Expected duration"
    }}
  }},
  "urgency": "emergency|consult_doctor|monitor",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "important_notes": ["Note 1", "Note 2"]
}}

CRITICAL REQUIREMENTS:
1. Be ACCURATE - medical errors can be dangerous
2. List 3-5 most likely conditions ranked by probability
3. Provide evidence-based treatments with specific dosages when applicable
4. Clearly indicate urgency level
5. ALWAYS emphasize: "This is NOT a medical diagnosis - consult a healthcare professional"
6. For emergencies, strongly recommend immediate medical attention
7. Include red flag symptoms to watch for

Be conservative, prioritize patient safety, and always recommend professional medical evaluation."""

        print("📡 Sending request to OpenAI GPT-4...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a medical AI assistant. Provide accurate, evidence-based medical information. Always emphasize this is informational only and not a substitute for professional medical care. Prioritize patient safety above all."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,  # Low temperature for more consistent, accurate responses
            max_tokens=2500
        )
        
        ai_response = response.choices[0].message.content
        print("✅ OpenAI GPT-4 response received!")
        
        # Extract JSON from response
        try:
            # Remove markdown code blocks if present
            if "```json" in ai_response:
                json_start = ai_response.find("```json") + 7
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            elif "```" in ai_response:
                json_start = ai_response.find("```") + 3
                json_end = ai_response.find("```", json_start)
                ai_response = ai_response[json_start:json_end].strip()
            
            ai_data = json.loads(ai_response)
            
            # Enhance base analysis with AI insights
            enhanced_diagnosis = base_analysis.get("diagnosis", "")
            enhanced_diagnosis += "\n\n**🤖 AI-Enhanced Medical Analysis:**\n\n"
            
            if ai_data.get("possible_conditions"):
                for i, cond in enumerate(ai_data.get("possible_conditions", [])[:5], 1):
                    enhanced_diagnosis += f"**{i}. {cond.get('name', 'Unknown')}** - {cond.get('confidence', 'N/A')}% confidence\n"
                    enhanced_diagnosis += f"   • Medical reasoning: {cond.get('reasoning', 'No reasoning provided')}\n\n"
            
            # Update with AI data
            if ai_data.get("possible_conditions"):
                base_analysis["possible_conditions"] = [c.get("name") for c in ai_data.get("possible_conditions", [])]
                base_analysis["confidence_scores"] = {c.get("name"): c.get("confidence", 0) for c in ai_data.get("possible_conditions", [])}
            
            if ai_data.get("treatments"):
                base_analysis["treatments"].update(ai_data.get("treatments", {}))
            
            if ai_data.get("urgency"):
                base_analysis["urgency"] = ai_data.get("urgency")
            
            if ai_data.get("recommendations"):
                base_analysis["recommendations"] = ai_data.get("recommendations", [])
            
            if ai_data.get("important_notes"):
                base_analysis["recommendations"].extend([f"⚠️ {note}" for note in ai_data.get("important_notes", [])])
            
            base_analysis["diagnosis"] = enhanced_diagnosis
            base_analysis["ai_enhanced"] = True
            
        except json.JSONDecodeError:
            # If JSON parsing fails, append AI text
            base_analysis["diagnosis"] += f"\n\n**🤖 AI-Enhanced Analysis:**\n{ai_response}"
            base_analysis["ai_enhanced"] = True
        
        return base_analysis
        
    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        # Return base analysis if AI fails
        return base_analysis

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Main chat endpoint - AI-powered symptom analysis using OpenAI GPT-4
    """
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({
                "error": "Please provide a message"
            }), 400
        
        # Use OpenAI GPT-4 as PRIMARY analyzer - ALWAYS use AI, NEVER hardcoded fallback
        if not client:
            return jsonify({
                "success": False,
                "error": "OpenAI API not configured",
                "message": "Please configure OpenAI API key for AI analysis."
            }), 500
        
        print(f"🤖 Analyzing symptoms with OpenAI GPT-4: '{user_message}'")
        try:
            result = get_ai_complete_diagnosis(user_message)
        except Exception as ai_error:
            print(f"❌ get_ai_complete_diagnosis raised exception: {ai_error}")
            import traceback
            traceback.print_exc()
            result = {
                "diagnosis": f"**⚠️ Analysis Error:**\n\nAn error occurred while analyzing your symptoms: {user_message}\n\n**Error:** {str(ai_error)}\n\nPlease try again or consult a healthcare professional.\n\n⚠️ **This requires professional medical evaluation.**",
                "possible_conditions": [],
                "detected_symptoms": user_message.split()[:5],
                "urgency": "consult_doctor",
                "recommendations": ["Try again", "Consult a healthcare professional"],
                "confidence_scores": {},
                "treatments": {},
                "ai_enhanced": False,
                "timestamp": datetime.now().isoformat()
            }
        
        # Ensure result is valid - if AI failed, provide basic response
        if not result:
            result = {
                "diagnosis": f"**Analysis:** Based on your symptoms: {user_message}\n\nPlease consult a healthcare professional for proper evaluation.",
                "possible_conditions": [],
                "detected_symptoms": [],
                "urgency": "consult_doctor",
                "recommendations": ["Consult a healthcare professional"],
                "confidence_scores": {},
                "treatments": {},
                "ai_enhanced": True,
                "timestamp": datetime.now().isoformat()
            }
        
        # Ensure all required fields are present
        response_data = {
            "success": True,
            "response": result.get("diagnosis", "Analysis completed"),
            "possible_conditions": result.get("possible_conditions", []),
            "detected_symptoms": result.get("detected_symptoms", []),
            "urgency": result.get("urgency", "monitor"),
            "recommendations": result.get("recommendations", []),
            "confidence_scores": result.get("confidence_scores", {}),
            "treatments": result.get("treatments", {}),
            "ai_enhanced": result.get("ai_enhanced", True),
            "timestamp": result.get("timestamp", datetime.now().isoformat())
        }
        
        return jsonify(response_data)
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in chat endpoint: {error_details}")  # Debug logging
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "An error occurred while analyzing symptoms. Please try again."
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "healthy",
        "service": "Medical Diagnosis Bot API"
    })

@app.route('/api/test-symptom', methods=['GET'])
def test_symptom_detection():
    """
    Test endpoint to verify symptom detection is working
    """
    test_cases = ["fever", "I have fever", "headache", "I have a headache"]
    results = {}
    for test in test_cases:
        result = analyze_symptoms(test)
        results[test] = {
            "detected": result.get("detected_symptoms", []),
            "has_conditions": len(result.get("possible_conditions", [])) > 0,
            "diagnosis_preview": result.get("diagnosis", "")[:100]
        }
    return jsonify({
        "status": "test_results",
        "results": results,
        "symptom_synonyms_keys": list(SYMPTOM_SYNONYMS.keys()),
        "knowledge_base_keys": list(MEDICAL_KNOWLEDGE_BASE.keys())
    })

@app.route('/', methods=['GET'])
def root():
    """
    Root endpoint
    """
    return jsonify({
        "message": "Medical Diagnosis Bot API",
        "status": "running",
        "availableRoutes": [
            "POST /api/chat - Send symptoms for diagnosis",
            "GET /api/health - Health check",
            "GET /api/test-symptom - Test symptom detection"
        ]
    })

@app.errorhandler(404)
def not_found(error):
    """
    Handle 404 errors
    """
    return jsonify({
        "message": "Route not found",
        "availableRoutes": [
            "GET /api/health",
            "POST /api/chat"
        ]
    }), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    app.run(debug=True, host='0.0.0.0', port=port)
