"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.createUserSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createUserSchema = zod_1.default.object({
    name: zod_1.default.string().min(2, "The name must be a least 2 characters long"),
    email: zod_1.default.email("Invalid email format "),
    password: zod_1.default.string().min(6, "Password must be at least 6 characters long"),
});
exports.loginSchema = zod_1.default.object({
    email: zod_1.default.email("Invalid email format"),
    password: zod_1.default.string().min(1, "Password is required"),
});
