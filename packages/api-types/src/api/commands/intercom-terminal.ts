// COMMANDS

export interface IntercomConnectCommand {
  command: 'intercom-terminal.connect';
  params: {
    clientId: number;
  };
}

export interface IntercomDisconnectCommand {
  command: 'intercom-terminal.disconnect';
  params: {
    clientId: number;
  };
}

export interface IntercomDialCommand {
  command: 'intercom-terminal.dial';
  params: {
    callId: string;
    offerSdp: string;
  };
}

export interface IntercomCancelCallCommand {
  command: 'intercom-terminal.cancel-call';
  params: {
    callId: string;
  };
}

export interface IntercomAnswerCallCommand {
  command: 'intercom-terminal.answer';
  params: {
    callId: string;
    userAgentId: string;
    answerSdp: string;
  };
}

export interface IntercomHangUpCommand {
  command: 'intercom-terminal.hang-up';
  params: {
    callId: string;
  };
}

export type IntercomTerminalCommand =
  | IntercomConnectCommand
  | IntercomDisconnectCommand
  | IntercomDialCommand
  | IntercomCancelCallCommand
  | IntercomAnswerCallCommand
  | IntercomHangUpCommand;
