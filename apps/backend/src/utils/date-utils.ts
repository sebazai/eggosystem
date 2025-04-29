export const getOneDayLaterInMillis = () => {
  const now = new Date();
  const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return oneDayLater.getTime();
};
