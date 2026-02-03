export const Streak: React.FC<{ streak: number | null }> = ({ streak }) => {
  const value = streak ?? 0;

  return (
    <div
      className="streak-badge"
      title={`Current streak: ${value}`}
      aria-label={`Current streak: ${value}`}
    >
      <span className="streak-emoji">🔥</span>
      <span className="streak-number">{value}</span>
    </div>
  );
};

export default Streak;