const autocannon = require("autocannon");

const instance = autocannon(
  {
    url: "http://localhost:5000/api/v1/billers/upload-bills",
    connections: 10,
    duration: 10,
    method: "POST",
    headers: {
      cookie: "access_token=YOUR_TOKEN_HERE",
      // We simulate the multipart boundary
      "content-type":
        "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
    },
    // This is a minimal valid multipart body with a "file"
    body: `------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="period"

2026-May
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="dueDate"

2026-06-30
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="test.csv"
Content-Type: text/csv

billReference,amount
REF-${Math.random()},100
------WebKitFormBoundary7MA4YWxkTrZu0gW--`,
  },
  (err, result) => {
    console.log("Stress Test Finished");
  },
);

autocannon.track(instance);
