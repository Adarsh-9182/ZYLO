"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="a-card a-empty">
      <h2>We couldn’t load this part of your store.</h2>
      <p>Your saved data is safe. Try again to reconnect.</p>
      <button className="a-button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
