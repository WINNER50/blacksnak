const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5000/api/settings');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (e) {
        if (e.response) {
            console.log('Error Status:', e.response.status);
            console.log('Error Data:', e.response.data);
        } else {
            console.log('Error:', e.message);
        }
    }
}
test();
