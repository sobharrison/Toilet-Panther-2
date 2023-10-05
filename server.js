const express = require('express');
const app = express();

// Define the directory containing your static files (e.g., HTML, CSS, JavaScript).
app.use(express.static(__dirname + '/webcontent'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

// Start the server on a specific port (e.g., 3000).
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});