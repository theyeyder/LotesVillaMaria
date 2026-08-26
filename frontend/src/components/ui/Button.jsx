import "./Button.css";

export default function Button({ children, variant = "primary", className = "", ...props }) {
  return <button className={`ui-button ui-button--${variant} ${className}`} {...props}>{children}</button>;
}
