export const convertTimeToLocalTimeWithoutSeconds = (time: string) => {
  const date = new Date(time);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
};
