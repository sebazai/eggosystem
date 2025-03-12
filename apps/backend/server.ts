import { app } from "./src/app";

const port = process.env.PORT || 3001;

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started at ${process.env.BACKEND_URL}`);
});
