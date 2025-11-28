import type { ReactNode } from "react";

export type StatusVariant = "info" | "loading" | "error" | "success";

type StatusMessageProps = {
  variant?: StatusVariant;
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
  role?: "alert" | "status";
};

const variantClass: Record<StatusVariant, string> = {
  info: "",
  loading: "status-loading",
  error: "status-error",
  success: "status-success",
};

const StatusMessage = ({ variant = "info", title, children, actions, role }: StatusMessageProps) => (
  <div className={`status ${variantClass[variant]}`.trim()} role={role}>
    {title && <p className="status-title">{title}</p>}
    {children && (typeof children === "string" ? <p>{children}</p> : children)}
    {actions && <div className="status-actions">{actions}</div>}
  </div>
);

export default StatusMessage;
