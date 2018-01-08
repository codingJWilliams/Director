var io = require('socket.io')(33323);
const fs = require("fs");
var sha256 = require("sha256");

io.on('connection', function (socket) {
  console.log("Recieved connection, ID " + socket.id)
  socket.emit("provideAuth")
  socket.on("auth", ({
    clientid,
    clientsecret
  }) => {
    var clients = getClients();
    if (!clients.hasOwnProperty(clientid)) {
      socket.emit("auth.fail", "Bad client ID")
      socket.disconnect(true);
      return;
    };
    var client = clients[clientid];
    var clientSecretHash = sha256(clientsecret);
    if (client.secretHash !== clientSecretHash) {
      socket.emit("auth.fail", "Bad client secret");
      socket.disconnect(true);
      return;
    };
    console.log(`Authed ${socket.id} successfully`)
    socket.join(clientid);
    console.log(`Joined client ${socket.id} to room ${clientid}`);
    socket.on("plsBroadcast", function (d) {
      socket.broadcast.emit(d.event, d.payload)
    })
    socket.on("plsSend", function (d) {
      socket.to(d.targetclientid, d.payload)
    })
  })
});
const getClients = () => {
  return JSON.parse(fs.readFileSync("./clients.json")
    .toString())
}