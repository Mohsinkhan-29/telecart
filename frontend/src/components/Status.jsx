export const Loading = () => <p className="text-chrome py-10">Loading…</p>;
export const ErrorBox = ({ message, onRetry }) => (
  <div className="py-10">
    <p className="text-danger">{message}</p>
    {onRetry && <button onClick={onRetry} className="btn btn-outline mt-3">Try again</button>}
  </div>
);
