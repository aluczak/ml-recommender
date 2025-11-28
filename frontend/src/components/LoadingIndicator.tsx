type LoadingIndicatorProps = {
  label?: string;
};

const LoadingIndicator = ({ label = "Loading" }: LoadingIndicatorProps) => (
  <div className="loading-indicator" role="status" aria-live="polite">
    <span className="loading-indicator-spinner" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export default LoadingIndicator;
