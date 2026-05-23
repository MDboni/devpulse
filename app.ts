import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { StatusCodes } from "http-status-codes";
import logger from "./src/middleware/logger";
import globalErrorHandler from "./src/middleware/globalErrorHandler";
import router from "./src/routes/index";

const app: Application = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*" }));
app.use(logger);

app.get("/", (_req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "DevPulse API is running",
    author: "DevPulse Team",
  });
});

app.use("/api", router);

app.use((_req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found",
  });
});

app.use(globalErrorHandler);

export default app;
