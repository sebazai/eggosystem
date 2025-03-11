import { app } from "./src/app";

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server started at http://${process.env.BACKEND_URL}:${port}`);
});
