export function getErrorMessage(error: unknown, noDefaultMessage?: boolean) {
  if (error instanceof Error && (error as any).isValidationError) {
    return error.message;
  } else if (typeof error === "string" && error && error.length > 0) {
    return error as string;
  } else {
    return !noDefaultMessage ? "no error message!" : null;
  }
}

export function getRoutErrorMessageFunc(errorTitle: string) {
  return (message: string) => {
    return {
      error: errorTitle,
      message: message,
    };
  };
}
