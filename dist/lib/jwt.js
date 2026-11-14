"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function generateToken(userId) {
    const payload = {
        id: userId,
    };
    const SECRET_KEY = process.env.JWT_SECRET;
    if (!SECRET_KEY) {
        throw new Error("A variável de ambiente JWT_SECRET não está definida.");
    }
    const options = {
        expiresIn: "1h",
        issuer: "minha-api",
        audience: "meu-front",
        subject: userId,
    };
    const token = jsonwebtoken_1.default.sign(payload, SECRET_KEY, options);
    return token;
}
