export const getPath = (path: string) => {
  if (process.env.BASE_PATH) {
    return `${process.env.BASE_PATH}${path}`;
  }
  return path;
};
