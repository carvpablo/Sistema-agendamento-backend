import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger";

import clientRoutes from "./routes/clientsRoutes";
import professionalRoutes from "./routes/professionalsRoutes";
import servicesRoutes from "./routes/servicesRoutes";
import appointmentRoutes from "./routes/appointmentRoutes";
import authRoutes from "./routes/authRoutes";
import validateToken from "./middleware/validateToken";

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(cookieParser());

// Documentação Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/clients", validateToken, clientRoutes);

// professionalsRoutes gerencia suas próprias proteções internas
app.use("/professionals", professionalRoutes);

app.use("/services", servicesRoutes);

app.use("/appointments", validateToken, appointmentRoutes);

app.use("/auth", authRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
});
