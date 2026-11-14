"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./docs/swagger");
const clientsRoutes_1 = __importDefault(require("./routes/clientsRoutes"));
const professionalsRoutes_1 = __importDefault(require("./routes/professionalsRoutes"));
const servicesRoutes_1 = __importDefault(require("./routes/servicesRoutes"));
const appointmentRoutes_1 = __importDefault(require("./routes/appointmentRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const validateToken_1 = __importDefault(require("./middleware/validateToken"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Documentação Swagger UI
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocument));
app.use("/clients", validateToken_1.default, clientsRoutes_1.default);
// professionalsRoutes gerencia suas próprias proteções internas
app.use("/professionals", professionalsRoutes_1.default);
app.use("/services", servicesRoutes_1.default);
app.use("/appointments", validateToken_1.default, appointmentRoutes_1.default);
app.use("/auth", authRoutes_1.default);
if (process.env.NODE_ENV !== "test") {
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
        console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
    });
}
exports.default = app;
