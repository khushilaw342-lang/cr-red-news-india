import serverless from "serverless-http";
import app from "./app-core";

export const handler = serverless(app);
