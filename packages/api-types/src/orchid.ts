export type OrchidLoginResponse = {
  token: string;
  sessionId: string;
  id: string;
  username: string;
  emailAddress: string | null;
  admin: boolean;
  libraryAccess: boolean;
  groups: {
    id: string;
    name: string;
    description: string;
  }[];
  identity: {
    authProvider: string;
    id: string;
    name: string;
  };
};
