export const getPath = (path: string) => {
  if (process.env.BASE_PATH) {
    console.log("PATH", `${process.env.BASE_PATH}${path}`);
    return `${process.env.BASE_PATH}${path}`;
  }
  return path;
};
