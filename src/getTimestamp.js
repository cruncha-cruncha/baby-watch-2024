export const getTimeStamp = () => {
  const now = new Date();
  return Math.floor(
    (now.getTime() + now.getTimezoneOffset() * 60 * 1000) / 1000,
  );
};
