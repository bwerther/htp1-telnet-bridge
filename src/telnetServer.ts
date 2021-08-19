import { createServer, Socket } from 'net';
import { sendWatchedFields } from './mso';
import { processCommand } from './commands';
import chalk from 'chalk';

const clients: Record<number, Socket> = {};
var lastId = -1;

// Handles sockets for our server
function socketHandler(socket: Socket) {
  const myId = ++lastId;
  clients[myId] = socket;

  // We received a command from the client
  socket.on('data', function (data) {
    processCommand(myId, data.toString('utf8').trim());
  });

  // The socket closed
  socket.on('close', function () {
    console.log(
      chalk.green.bold(
        `[${new Date().toUTCString()}] Disconnected client #${myId}`
      )
    );
    delete clients[myId];
  });

  // Client is added -- now send it all of the current watch fields
  console.log(
    chalk.green.bold(`[${new Date().toUTCString()}] Connected client #${myId}`)
  );
  sendWatchedFields(myId);
}

// Send a message back to a client
export function sendField(clientId: number, name: string, val: string) {
  const socket = clients[clientId];

  if (!socket)
    console.log(
      chalk.red.bold(
        `[${new Date().toUTCString()}] Failed to sendMessage to clientId ${clientId}: invalid socket`
      )
    );
  else {
    socket.write(`${name} ${val}\n`);
  }
}

// Send data to the clients
export function broadcastField(name: string, val: string) {
  // Send data to all the connected sockets
  Object.values(clients).forEach((socket) => {
    socket.write(`${name} ${val}\n`);
  });
}

// Sends an error to a client
export function sendError(clientId: number, error: Error) {
  const socket = clients[clientId];

  if (!socket)
    console.log(
      chalk.red.bold(
        `[${new Date().toUTCString()}] Failed to sendError to clientId ${clientId}: invalid socket`
      )
    );
  else {
    socket.write(`Error: ${error.message}\n`);
  }
}

// Starts a simple telnet server
export function startTelnetServer(port: number) {
  const server = createServer(socketHandler);

  server.listen(port);
}
