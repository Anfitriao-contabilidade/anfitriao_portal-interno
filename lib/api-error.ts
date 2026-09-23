/** Erro devolvido pela Anfitrião API (sem "server-only": o tipo é usado também em lib/actions). */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public details?: { loc?: (string | number)[]; msg?: string }[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}
