const axios = require('axios');

async function verifyMigraine() {
    console.log("🚀 Verifying Migraine Diagnosis...");

    // User's specific complaint
    // "Severe headache on one side since morning. Light and noise make it worse. Feeling nauseous but no vomiting. Need to lie down."
    const symptoms = [
        "Severe headache on one side since morning",
        "Light and noise make it worse",
        "Feeling nauseous but no vomiting",
        "Need to lie down"
    ];

    try {
        const response = await axios.post('http://localhost:5002/predict_symptoms', { symptoms });
        const result = response.data;

        console.log(`\nInput: ${JSON.stringify(symptoms)}`);
        console.log(`🤖 AI Diagnosis: "${result.diagnosis}" (${result.confidence}%)`);
        console.log(`🧠 AI Reasoning: "${result.reasoning}"`);
        console.log(`📋 Differentials: ${JSON.stringify(result.differentials)}`);

        const d = result.diagnosis.toLowerCase();
        if (d.includes('migraine')) {
            console.log("\n✅ SUCCESS: Correctly diagnosed as Migraine.");
        } else {
            console.log("\n❌ FAILURE: Misdiagnosed as " + result.diagnosis);
        }

    } catch (e) {
        console.error("Error connecting to AI:", e.message);
    }
}

verifyMigraine();
