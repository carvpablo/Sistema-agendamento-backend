"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validateToken = async (req, res, next) => {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }
    // 2. Se não achou no header, tenta pegar dos cookies (caso use cookie-parser)
    else if (req.cookies?.jwt_token) {
        token = req.cookies.jwt_token;
    }
    if (!token) {
        return res.status(401).json({ error: "Invalid token" });
    }
    const SECRET_KEY = process.env.JWT_SECRET;
    if (!SECRET_KEY) {
        throw new Error("JWT_SECRET not defined on .env");
    }
    try {
        // 3. Valida a assinatura, expiração e configurações do token
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY, {
            issuer: "minha-api",
            audience: "meu-front",
        });
        // 4. Injeta os dados do usuário na requisição
        req.user = {
            id: decoded.id,
        };
        // 5. Continua para a próxima função / controller
        return next();
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({ error: "Token expirado." });
        }
        return res.status(401).json({ error: "Token inválido." });
    }
};
exports.default = validateToken;
