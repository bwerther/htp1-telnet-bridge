import { sendToHtp1 } from './websocket';
import { sendError } from './telnetServer';
import { getMso, sendWatchedFields } from './mso';

// Validates a numeric parameter
function getNumericParam(
  param: string | undefined,
  allowNegative = true,
  defaultValue: number | undefined = undefined
): number | Error {
  if (param === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    else return Error('Invalid parameter');
  }

  const result = +param;

  if (isNaN(result)) return Error('Invalid parameter');

  if (!allowNegative && result < 0) return Error('Invalid parameter');

  return result;
}

// Validates a string parameter
function getStringParam(
  param: string | undefined,
  defaultValue: string | undefined = undefined
): string | Error {
  if (param === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    else return Error('Invalid parameter');
  }

  return param;
}

// Handles a command from the telnet interface
export const processCommand = (clientId: number, body: string): void => {
  // Split it by spaces, respecting double quotes
  const split = body.match(/(?:[^\s"]+|"[^"]*")+/g);
  const command = split?.[0];
  const param = split?.[1];

  switch (command) {
    case 'Status':
      sendWatchedFields(clientId);
      break;

    case 'IncVolume':
    case 'DecVolume':
      {
        // Relative volume change
        // - optional amount param, otherwise defaults to 1
        const mso = getMso();
        if (Number.isInteger(mso.volume)) {
          let newVolume: number = mso.volume;

          // Process the parameter
          const deltaNum = getNumericParam(param, false, 1);
          if (deltaNum instanceof Error) {
            sendError(clientId, deltaNum);
          } else {
            if (command === 'IncVolume') newVolume += deltaNum;
            else newVolume -= deltaNum;

            setVolume(clientId, newVolume);
          }
        } else {
          console.log('Invalid MSO state - ignoring relative volume command');
        }
      }
      break;

    case 'SetVolume':
      {
        const newVolume = getNumericParam(param);
        if (newVolume instanceof Error) {
          sendError(clientId, newVolume);
        } else {
          setVolume(clientId, newVolume);
        }
      }
      break;

    case 'SetPower':
      {
        const power = getStringParam(param);
        if (power instanceof Error) {
          sendError(clientId, power);
        } else {
          setPower(clientId, power);
        }
      }
      break;

    case 'SetMute':
      {
        const mute = getStringParam(param);
        if (mute instanceof Error) {
          sendError(clientId, mute);
        } else {
          setMute(clientId, mute);
        }
      }
      break;

    case 'SetInput':
      {
        const input = getStringParam(param);
        if (input instanceof Error) {
          sendError(clientId, input);
        } else {
          setInput(clientId, input);
        }
      }
      break;

    case 'SetUpmix':
      {
        const upmix = getStringParam(param);
        if (upmix instanceof Error) {
          sendError(clientId, upmix);
        } else {
          setUpmix(clientId, upmix);
        }
      }
      break;

    case 'SetNight':
      {
        const night = getStringParam(param);
        if (night instanceof Error) {
          sendError(clientId, night);
        } else {
          setNight(clientId, night);
        }
      }
      break;

    case 'SetDirac':
      {
        const dirac = getStringParam(param);
        if (dirac instanceof Error) {
          sendError(clientId, dirac);
        } else {
          setDirac(clientId, dirac);
        }
      }
      break;

    case 'SetLoudness':
      {
        const loudness = getStringParam(param);
        if (loudness instanceof Error) {
          sendError(clientId, loudness);
        } else {
          setLoudness(clientId, loudness);
        }
      }
      break;

    case 'SetDialogEnh':
      {
        const dialogEnh = getNumericParam(param);
        if (dialogEnh instanceof Error) {
          sendError(clientId, dialogEnh);
        } else {
          setDialogEnh(clientId, dialogEnh);
        }
      }
      break;

    default:
      sendError(clientId, Error(`Unknown command: ${command}`));
  }
};

// Set volume
function setVolume(clientId: number, vol: number) {
  const mso = getMso();

  const minVolume: number = mso.cal.vpl ?? -100;
  const maxVolume: number = mso.cal.vph ?? 0;

  // Check if it is in range
  if (vol < minVolume || vol > maxVolume) {
    sendError(clientId, Error('Invalid parameter'));
  } else {
    sendToHtp1(`changemso [{"op":"replace","path":"/volume","value":${vol}}]`);
  }
}

// Set power on or off
export function setPower(clientId: number, power: string) {
  if (power === 'on' || power === 'off') {
    sendToHtp1(
      `changemso [{"op":"replace","path":"/powerIsOn","value":${
        power === 'on'
      }}]`
    );
  } else {
    sendError(clientId, Error('Invalid parameter'));
  }
}

// Set muted on or off
export function setMute(clientId: number, mute: string) {
  if (mute === 'on' || mute === 'off') {
    sendToHtp1(
      `changemso [{"op":"replace","path":"/muted","value":${mute === 'on'}}]`
    );
  } else {
    sendError(clientId, Error('Invalid parameter'));
  }
}

// Set the input
export function setInput(clientId: number, input: string) {
  const mso = getMso();
  const inputs = mso?.inputs;

  if (!inputs) {
    console.log('Invalid MSO state - ignoring set input');
  } else {
    if (inputs[input]) {
      sendToHtp1(
        `changemso [{"op":"replace","path":"/input","value":"${input}"}]`
      );
    } else {
      sendError(clientId, Error('Invalid parameter'));
    }
  }
}

// Set the surround upmix
export function setUpmix(clientId: number, upmix: string) {
  const mso = getMso();
  const upmixList = mso?.upmix;

  if (!upmixList) {
    console.log('Invalid MSO state - ignoring set surround mode');
  } else {
    if (upmixList[upmix]) {
      sendToHtp1(
        `changemso [{"op":"replace","path":"/upmix/select","value":"${upmix}"}]`
      );
    } else {
      sendError(clientId, Error('Invalid parameter'));
    }
  }
}

// Set night mode to on, off, or auto
export function setNight(clientId: number, night: string) {
  if (night === 'on' || night === 'off' || night === 'auto') {
    sendToHtp1(
      `changemso [{"op":"replace","path":"/night","value":"${night}"}]`
    );
  } else {
    sendError(clientId, Error('Invalid parameter'));
  }
}

// Set dirac mode to on, off, or bypass
export function setDirac(clientId: number, dirac: string) {
  if (dirac === 'on' || dirac === 'off' || dirac === 'bypass') {
    sendToHtp1(
      `changemso [{"op":"replace","path":"/cal/diracactive","value":"${dirac}"}]`
    );
  } else {
    sendError(clientId, Error('Invalid parameter'));
  }
}

// Set loudness mode to on or off
export function setLoudness(clientId: number, loudness: string) {
  if (loudness === 'on' || loudness === 'off') {
    sendToHtp1(
      `changemso [{"op":"replace","path":"/loudness","value":"${loudness}"}]`
    );
  } else {
    sendError(clientId, Error('Invalid parameter'));
  }
}

// Set dialog enhancement to a value between 0 and 6
export function setDialogEnh(clientId: number, dialogEnh: number) {
  if (dialogEnh < 0 || dialogEnh > 6)
    sendError(clientId, Error('Invalid parameter'));
  else {
    sendToHtp1(
      `changemso [{"op":"replace","path":"/dialogEnh","value":${dialogEnh}}]`
    );
  }
}
