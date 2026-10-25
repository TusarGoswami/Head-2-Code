const axios = require('axios');


const getLanguageById = (lang) => {
    const language = {
        "c++": 54,
        "cpp": 54,
        "java": 62,
        "javascript": 63,
        "js": 63
    };

    const key = (typeof lang === 'string') ? lang.toLowerCase() : '';
    return language[key] || 63;
};

const submitBatch = async (submissions) => {
    const options = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            base64_encoded: 'false'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error('Judge0 batch submit error:', error?.response?.data || error.message);
        throw error;
    }
};

const waiting = (timer) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timer);
    });
};

const submitToken = async (resultToken) => {
    if (!resultToken || !Array.isArray(resultToken) || resultToken.length === 0) {
        return [];
    }

    const options = {
        method: 'GET',
        url: 'https://judge0-ce.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultToken.join(","),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_KEY,
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com'
        }
    };

    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max timeout

    while (attempts < maxAttempts) {
        attempts++;
        try {
            const response = await axios.request(options);
            const result = response.data;
            if (result && Array.isArray(result.submissions)) {
                const isResultObtained = result.submissions.every((r) => r.status_id > 2);
                if (isResultObtained) {
                    return result.submissions;
                }
            }
        } catch (error) {
            console.error('Judge0 polling error:', error?.response?.data || error.message);
        }
        await waiting(1000);
    }

    throw new Error('Code execution timed out waiting for Judge0 response');
};

module.exports = { getLanguageById, submitBatch, submitToken };








// 


