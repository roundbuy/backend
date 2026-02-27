const axios = require('axios');
async function test() {
  try {
     const res = await axios.get('http://localhost:5001/api/v1/mobile-app/rewards/level-rewards', {
        headers: { 'Authorization': 'Bearer ' + '' }
     });
     console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
     console.log(e.message);
  }
}
test();
