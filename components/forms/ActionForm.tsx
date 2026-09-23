"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import { initialActionState, type ActionState } from "@/lib/actions";
import { cn } from "@/lib/cn";
import { CheckCircle2, XCircle } from "lucide-react";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>(initialActionState);
const FormPendingContext = createContext(false);
export const useFormState = () => useContext(FormStateContext);
export const useFormPending = () => useContext(FormPendingContext);

/**
 * Formulário ligado a uma Server Action via useActionState: mostra erros por
 * campo, mensagem de sucesso/erro acessível (aria-live) e estado de envio.
 * Funciona sem JavaScript também (progressive enhancement).
 *
 * Com JavaScript, o envio é feito manualmente (onSubmit) para evitar o reset
 * automático do React 19 — assim, se a validação falhar, o usuário não perde
 * o que digitou.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  showMessage = true,
  id,
  "aria-label": ariaLabel,
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  showMessage?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const ref = useRef<HTMLFormElement>(null);

  // Marca o formulário como hidratado (útil para testes E2E e diagnósticos).
  useEffect(() => {
    ref.current?.setAttribute("data-ready", "");
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return; // evita envio duplo
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <FormStateContext.Provider value={state}>
      <FormPendingContext.Provider value={pending}>
        <form
          ref={ref}
          action={formAction}
          onSubmit={onSubmit}
          className={className}
          id={id}
          aria-label={ariaLabel}
          aria-busy={pending || undefined}
          data-af=""
        >
          {children}
          {showMessage && <FormMessage />}
        </form>
      </FormPendingContext.Provider>
    </FormStateContext.Provider>
  );
}

export function FormMessage({ className }: { className?: string }) {
  const state = useFormState();
  return (
    <div aria-live="polite" role="status" className={cn("empty:hidden", className)}>
      {state.message && (
        <p
          key={state.ts}
          className={cn(
            "mt-1 flex animate-fade-in items-start gap-2 rounded-lg border px-3 py-2 text-sm",
            state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
          )}
        >
          {state.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          {state.message}
        </p>
      )}
    </div>
  );
}
