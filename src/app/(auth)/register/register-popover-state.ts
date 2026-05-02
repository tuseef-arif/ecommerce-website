export type RegisterPopoverState = {
  errorMessage: string | null;
  success: boolean;
  /** Present after successful registration so the client can pre-fill login */
  emailForLogin?: string;
};

export const registerPopoverInitialState: RegisterPopoverState = {
  errorMessage: null,
  success: false,
  emailForLogin: undefined,
};
