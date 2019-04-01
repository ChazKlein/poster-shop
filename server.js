var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var fs = require("fs");
// Define Pusher
var Pusher = require('pusher');

require('dotenv').config();

// Create pusher instance
var pusher = new Pusher({
	appId: process.env.PUSHER_APP_ID,
	key: process.env.PUSHER_APP_KEY,
	secret: process.env.PUSHER_APP_SECRET,
	cluster: process.env.PUSHER_CLUSTER
});


var bodyParser = require("body-parser");
app.use(bodyParser.json());

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname + "/index.html"));
});

var directory;
fs.readFile("./directory.json", "utf8", function(err, data) {
	directory = JSON.parse(data);
	if (err) {
		throw err;
	}
});

app.get("/search", function(req, res) {
	var results = directory.reduce(function(acc, file) {
		if (file.tags.indexOf(req.query.q) !== -1) {
			acc.push({
				id: file.id,
				title: file.title,
				thumb: "/public/images/".concat(file.thumb),
				price: file.price
			});
		}
		return acc;
	}, []);
	res.send(results);
});

// Push cart update post in server
app.post('/cart_update', function(req, res) {
	pusher.trigger('cart', 'update', req.body);
});

app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use("/public", express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV !== "production") {
	require("reload")(app);
}

var port = process.env.PORT || 3000;
server.listen(port, function () {
	console.log("Listening on port ".concat(port));
});
