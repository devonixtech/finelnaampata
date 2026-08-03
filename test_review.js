const axios = require('axios');

async function run() {
  try {
    const res = await axios.post('http://localhost:3001/api/v1/reviews', {
      businessId: 'c972124f-95ed-4ab6-a480-08715e356b70',
      rating: 5,
      comment: 'This is a test review to see if notification works!'
    }, {
      headers: {
        // I need a valid token to submit a review!
      }
    });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
run();
