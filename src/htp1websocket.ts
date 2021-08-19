import WebSocket from 'ws';
import { applyPatch } from 'fast-json-patch';
import { getMso, setMso } from './mso';
import chalk from 'chalk';

// Holds the current websocket
let ws: WebSocket;

// Connects to the HTP-1 at the address, and initializes the event handlers
export function connectToHtp1(address: string) {
  ws = new WebSocket(`ws://${address}/ws/controller`);

  ws.on('open', function open() {
    console.log(chalk.blue.bold('----'));
    console.log(
      chalk.blue.bold(
        `[${new Date().toUTCString()}] Connected to HTP-1 at address ${address}`
      )
    );
    console.log(chalk.blue.bold('----'));
    // Request the current MSO record for the device
    ws.send('getmso');
  });

  //
  // Handle receiving a message from the HTP-1
  //
  ws.on('message', function incoming(raw) {
    try {
      const body = raw.toString('utf8');
      const cmd = body.substring(0, body.indexOf(' '));
      const payload = JSON.parse(body.substring(body.indexOf(' ') + 1));

      switch (cmd) {
        case 'mso':
          // We're receiving a full MSO record, so replace what we have with it
          setMso(payload);
          break;
        case 'msoupdate':
          // We received a patch, so patch our MSO record

          // if (!Array.isArray(payload)) {
          //   console.log(
          //     'Skipping patch not wrapped in array: ' + JSON.stringify(payload)
          //   );
          // }
          setMso(applyPatch(getMso(), payload).newDocument);
          break;
      }
    } catch (err) {
      console.log(chalk.red.bold(`[${new Date().toUTCString()}] ${err}`));
    }
  });

  ws.onclose = function (e) {
    console.log(
      chalk.yellow.bold(
        `[${new Date().toUTCString()}] Socket is closed. Reconnect will be attempted in 1 second. ${
          e.reason
        }`
      )
    );
    setTimeout(function () {
      connectToHtp1(address);
    }, 1000);
  };

  ws.onerror = function (err) {
    console.log(
      chalk.red.bold(
        `[${new Date().toUTCString()}] Socket encountered error: ${
          err.message
        } Closing socket`
      )
    );
    ws.close();
  };
}

// Send commands to the HTP-1
export function sendToHtp1(command: string) {
  ws.send(command);
}
