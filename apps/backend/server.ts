import { app } from "./src/app";
import { logger } from "./src/utils/app-logger";

const port = process.env.PORT || 3001;

app.listen(port, () => {
  logger.info(`Server started at ${process.env.BACKEND_URL}`);
});
