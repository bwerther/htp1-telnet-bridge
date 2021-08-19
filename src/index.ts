import { connectToHtp1 } from './htp1websocket';
import { startTelnetServer } from './telnetServer';
import minimist from 'minimist';
import { exit } from 'process';

// Look for arguments with the HTP-1 address and our telnet port to serve on

const argv = minimist(process.argv.slice(2));

if (!argv.htp1Address) {
  console.log('Requires --htp1Address=xxx with the address of the processor');
  console.log(
    'Optionally takes --telnetPort=xxx with the address to serve at (defaults to 4000)'
  );
  exit();
}

// address of our HTP-1
const htp1Address: string = argv.htp1Address;
const telnetPort: number = argv.telnetPort ?? 4000;

connectToHtp1(htp1Address);
startTelnetServer(telnetPort);
