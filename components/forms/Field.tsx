"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useFormState } from "./ActionForm";

export const controlClass =
  "block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[15px] text-ink shadow-sm " +
  "placeholder:text-ink-soft/60 transition-colors " +
  "focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 " +
  "disabled:bg-paper disabled:text-ink-soft aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-red-100 sm:text-sm";

type Common = {
  label: ReactNode;
  name: string;
  hint?: ReactNode;
  className?: string;
  optional?: boolean;
};

function FieldShell({
  id,
  label,
  hint,
  error,
  className,
  optional,
  required,
  children,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  className?: string;
  optional?: boolean;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-ink">
        <span>
          {label}
          {required && <span className="text-red-700" aria-hidden> *</span>}
        </span>
        {optional && <span className="text-xs font-normal text-ink-soft">opcional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function useFieldProps(name: string, hint?: ReactNode) {
  const reactId = useId();
  const id = `${name}-${reactId}`;
  const { fieldErrors } = useFormState();
  const error = fieldErrors?.[name];
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return { id, error, describedBy };
}

export function InputField({
  label,
  name,
  hint,
  className,
  optional,
  ...props
}: Common & Omit<ComponentProps<"input">, "name">) {
  const { id, error, describedBy } = useFieldProps(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} optional={optional} required={props.required}>
      <input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClass}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  hint,
  className,
  optional,
  children,
  ...props
}: Common & Omit<ComponentProps<"select">, "name">) {
  const { id, error, describedBy } = useFieldProps(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} optional={optional} required={props.required}>
      <select
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlClass, "pr-8")}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextareaField({
  label,
  name,
  hint,
  className,
  optional,
  ...props
}: Common & Omit<ComponentProps<"textarea">, "name">) {
  const { id, error, describedBy } = useFieldProps(name, hint);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className} optional={optional} required={props.required}>
      <textarea
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={controlClass}
        {...props}
      />
    </FieldShell>
  );
}

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <legend className="mb-1 font-mono text-[.7rem] font-semibold uppercase tracking-[.12em] text-ink-soft">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}
