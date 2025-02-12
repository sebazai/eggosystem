import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'express-async-errors';
import 'dotenv/config';

import v1Router from './routes';
import { errorHandler } from './middlewares/errors';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use('/api/v1', v1Router);

app.use(errorHandler);

export { app };
