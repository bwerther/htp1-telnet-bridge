import { Socket } from 'net';
import readline from 'readline';
const socket = new Socket();

const host = '192.168.1.51';
const port = 23;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', function (line) {
  socket.write(line);
});

socket.on('error', (err) => console.log(err));
socket.on('data', (data) => console.log(data.toString('utf8')));
socket.connect(port, host, () => {
  console.log('[Connected]');
});
