export const INTERCOM_OPERATOR = 'intercom-operator' as const;

// COMMANDS

// STATE

export interface IntercomOperatorStateDto {
  ringing: string[];
  terminalByCalls: {
    [callId: string]: string;
  };
  sdpByCalls: {
    [callId: string]: string;
  };
  answererByCalls: {
    [callId: string]: string;
  };
}

// EVENTS
