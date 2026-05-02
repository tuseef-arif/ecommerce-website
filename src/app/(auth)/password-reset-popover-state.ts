export type RequestPasswordResetPopoverState = {
  errorMessage: string | null;
  success: boolean;
};

export const requestPasswordResetPopoverInitialState: RequestPasswordResetPopoverState =
  {
    errorMessage: null,
    success: false,
  };
