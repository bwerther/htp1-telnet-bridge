import { value } from 'jsonpath';
import { sendField, broadcastField } from './telnetServer';

// Holds the MSO object containing the state of the HTP-1
let mso: any;

type WatchFields = Record<string, { path?: string; val?: string }>;

let watched: WatchFields = {
  Volume: { path: '$.volume' },
  MinVolume: { path: '$.cal.vpl' },
  MaxVolume: { path: '$.cal.vph' },
  UnitName: { path: '$.unitname' },
  Power: { path: '$.powerIsOn' },
  Dirac: { path: '$.cal.diracactive' },
  Mute: { path: '$.muted' },
  Input: { path: '$.input' },
  InputLabel: {},
  Night: { path: '$.night' },
  Loudness: { path: '$.loudness' },
  DialogEnh: { path: '$.dialogEnh' },
  Upmix: { path: '$.upmix.select' },
  UpmixName: {},
  SurroundMode: { path: '$.status.SurroundMode' },
  DiracPlayback: { path: '$.status.DiracState' },
  ProgramFormat: { path: '$.status.DECProgramFormat' },
  ListeningFormat: { path: '$.status.ENCListeningFormat' },
  VideoResolution: { path: '$.videostat.VideoResolution' },
  HDRstatus: { path: '$.videostat.HDRstatus' },
};

const upmixList: Record<string, string> = {
  off: 'Direct',
  native: 'Native',
  dolby: 'Dolby Surround',
  dts: 'DTS Neural:X',
  auro: 'Auro-3D',
  mono: 'Mono',
  stereo: 'Stereo',
};

export const getMso = (): Readonly<any> => {
  return mso;
};

export const setMso = (newMso: any) => {
  mso = newMso;

  Object.keys(watched).forEach((name) => {
    const field = watched[name];
    let newVal: string;

    if (field.path) {
      newVal = JSON.stringify(value(mso, field.path));
    } else newVal = JSON.stringify(undefined);

    // Handle special treatmemt

    if (name === 'InputLabel') {
      newVal = JSON.stringify(
        mso?.input ? mso.inputs[mso.input].label : undefined
      );
    } else if (name === 'UpmixName') {
      const upmixName: string = upmixList[mso.upmix.select] ?? 'Unknown';

      newVal = JSON.stringify(upmixName);
    } else if (name === 'Power') {
      // Convert from boolean to on/off
      if (newVal === 'true') newVal = JSON.stringify('on');
      else newVal = JSON.stringify('off');
    } else if (name === 'Mute') {
      // Convert from boolean to on/off
      if (newVal === 'true') newVal = JSON.stringify('on');
      else newVal = JSON.stringify('off');
    }

    // Broadcast the field if it has changed

    if (newVal !== field.val) {
      field.val = newVal;
      broadcastField(name, field.val);
      console.log(`[${new Date().toUTCString()}] ${name} ${field.val}`);
    }
  });
};

// Sends all watched fields to a client
export function sendWatchedFields(clientId: number) {
  Object.keys(watched).forEach((name) => {
    sendField(clientId, name, watched[name].val ?? 'undefined');
  });
}
