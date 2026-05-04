export type RegisterPopoverState = {
  flow: "details" | "verify_otp";
  errorMessage: string | null;
  success: boolean;
  pendingEmail?: string;
  /** Present after successful registration so the client can pre-fill login */
  emailForLogin?: string;
};

export const registerPopoverInitialState: RegisterPopoverState = {
  flow: "details",
  errorMessage: null,
  success: false,
  pendingEmail: undefined,
  emailForLogin: undefined,
};
