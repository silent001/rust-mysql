const ip = "127.0.0.1"; // server IP-address
const rcon_port = "28016"; // server RCON-port
const rcon_pass = "password.123"; // server RCON-password

const WebRcon = require('webrconjs'); // node.js only
const mysql = require('mysql');

// Create a new client:
const rcon = new WebRcon(ip, rcon_port);

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "websockets",
  charset: "utf8mb4_unicode_ci"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected to MySQL Database!");
});
function insertData(sql){
	con.query(sql ,function (err, result) {
				if (err) throw err;
				//console.log("1 record inserted, ID: " + result.insertId);
	});
}
function cleanJSON(msg){
	let message = String(msg).replace(/(\r\n|\n|\r|\s{4}|\s{2})/gm,"");
	message = JSON.parse(message);
	return message;
}

// Handle events:
rcon.on('connect', function() {
    console.log('Connected to Rust server');
	// Run a command once connected:
    rcon.run('console.tail', 15);
	rcon.run('chat.tail', 25);
	//console.log(response)
})
rcon.on('disconnect', function() {
    console.log('DISCONNECTED');
})
rcon.on('message', function(msg) {
	if (msg.identity == 15){ //handle console.tail
		let message = cleanJSON(msg.message);
		message.forEach(function(element) {
		//console.log('ServerMessage ', element);
		//console.log(sql);
		let sql = mysql.format('INSERT INTO `console`(`Time`, `Message`) SELECT ?,? FROM dual WHERE NOT EXISTS (SELECT 1 FROM `console` WHERE `Time` = ? AND `Message` = (?))', [element.Time, element.Message, element.Time, element.Message]);
		insertData(sql);
		
		});
	  }else if (msg.identity == 25){ //handle chat.tail
		let message = cleanJSON(msg.message);
		message.forEach(function(element) {
		console.log('ServerChat ', element);
		});
	  }else if (msg.identity == -1){ //handle BetterChat Messages
		let chat = cleanJSON(msg.message);
		let message = String(chat.Message).replace(/^\[.*?\]\s(?<sender>.*?):\s/gm,"")
		let sql = mysql.format('INSERT INTO `betterchat`(`Time`, `UserId`, `Username`, `Message`) VALUES (?,?,?,?)', [chat.Time, chat.UserId, chat.Username, message]);
		insertData(sql);
		//console.log("BetterChat ",message);
	  }else{
		console.log(msg)
	  }
})
rcon.on('error', function(err) {
    console.log('ERROR:', err);
}) 
// Connect by providing the server's rcon.password:
rcon.connect(rcon_pass);
