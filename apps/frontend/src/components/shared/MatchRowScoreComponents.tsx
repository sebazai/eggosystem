export const MatchRowScoreComponents = ({
  score,
  teamWon
}: {
  score: number;
  teamWon: boolean;
}) => {
  return (
    <span className={teamWon ? "text-green-500" : "text-red-500"}>{score}</span>
  );
};
