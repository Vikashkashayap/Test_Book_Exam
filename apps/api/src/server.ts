import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import { syncExamEcosystem } from './services/exam-sync.service';
import { processDueScheduledMocks } from './services/test-builder.service';
import { env } from './config/env';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

app.use('/api/v1', routes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(errorHandler);

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const synced = await syncExamEcosystem();
  console.log(`Exam taxonomy synced: ${synced.exams} exams in ${synced.categories} categories`);
  app.listen(env.PORT, () => {
    console.log(`API server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // Process scheduled mock jobs every minute
  setInterval(() => {
    processDueScheduledMocks().catch((err) =>
      console.error('Scheduled mock processor error:', err)
    );
  }, 60_000);
  processDueScheduledMocks().catch(() => {});
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
