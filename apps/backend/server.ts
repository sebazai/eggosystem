import { app } from "./src/app";

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server started at ${process.env.BACKEND_URL}`);
});
