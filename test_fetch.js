const https = require('https');
https.get('https://picsum.photos/seed/123/1600/900', (res) => {
  console.log("Headers:", res.headers);
});
