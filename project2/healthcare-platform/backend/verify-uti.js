const axios = require('axios');

async function verifyUTI() {
    console.log("🚀 Verifying UTI Diagnosis Fix...");

    // User's specific complaint
    const symptoms = ["pain and burning while urinating", "discomfort in lower abdomen", "need to go many times"];

    try {
        const response = await axios.post('http://localhost:5002/predict_symptoms', { symptoms });
        const result = response.data;

        console.log(`\nInput: ${JSON.stringify(symptoms)}`);
        console.log(`🤖 AI Diagnosis: "${result.diagnosis}" (${result.confidence}%)`);
        console.log(`🧠 AI Reasoning: "${result.reasoning}"`);
        console.log(`📋 Differentials: ${JSON.stringify(result.top_3 ? result.top_3.map(d => d.diagnosis) : result.differentials)}`);

        if (result.diagnosis.toLowerCase().includes('urinary') || result.diagnosis.toLowerCase().includes('uti')) {
            console.log("\n✅ SUCCESS: Correctly diagnosed as UTI.");
        } else {
            console.log("\n❌ FAILURE: Still diagnosed as " + result.diagnosis);
        }

    } catch (e) {
        console.error("Error connecting to AI:", e.message);
    }
}

verifyUTI();
