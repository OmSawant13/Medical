const axios = require('axios');

async function testScenario(name, symptoms, expectedToInclude, expectedToExclude) {
    console.log(`\n🧪 Testing Scenario: ${name}`);
    console.log(`   Input: ${JSON.stringify(symptoms)}`);

    try {
        const response = await axios.post('http://localhost:5002/predict_symptoms', {
            symptoms: symptoms
        });

        const diagnosis = response.data.diagnosis;
        const confidence = response.data.confidence;
        const differentials = response.data.differentials || [];

        console.log(`   🤖 AI Diagnosis: "${diagnosis}" (${confidence}%)`);
        console.log(`   📋 Differentials: ${JSON.stringify(differentials.map(d => d.name))}`);

        let passed = true;

        if (expectedToInclude && diagnosis !== expectedToInclude) {
            console.log(`   ❌ FAILED: Expected "${expectedToInclude}", got "${diagnosis}"`);
            passed = false;
        }

        if (expectedToExclude) {
            if (diagnosis === expectedToExclude) {
                console.log(`   ❌ FAILED: Should NOT match "${expectedToExclude}"`);
                passed = false;
            }
            // Check differentials too
            if (differentials.some(d => d.name === expectedToExclude)) {
                console.log(`   ⚠️ WARNING: "${expectedToExclude}" appears in differentials.`);
            }
        }

        if (passed) console.log(`   ✅ PASSED`);
        return passed;

    } catch (error) {
        console.log(`   ❌ ERROR: Could not connect to ML Engine. Is it running on port 5002?`);
        console.log(`   ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log("🚀 Starting AI Logic Verification...");

    // 1. The "Blunder" Test - Stomach Pain should NOT be Fracture
    await testScenario(
        "The 'Blunder' Check (Stomach Pain)",
        ["stomach pain", "nausea"],
        "Acute Gastritis",
        "Fracture"
    );

    // 2. Semantic Logic Test - "Tummy" should map to Stomach
    await testScenario(
        "Semantic Logic (Slang: 'Tummy hurts')",
        ["my tummy hurts", "feeling sick"],
        "Acute Gastritis",
        null
    );

    // 3. Clear Fracture Test - Bone keywords SHOULD trigger Fracture
    await testScenario(
        "Valid Fracture (Bone + Trauma)",
        ["broken bone", "severe pain", "swelling", "fall"],
        "Fracture",
        null
    );

    // 4. Distinction Test - Viral Fever vs Typhoid
    await testScenario(
        "Viral Fever (General)",
        ["fever", "body pain", "chills"],
        "Viral Fever",
        null
    );
}

runTests();
