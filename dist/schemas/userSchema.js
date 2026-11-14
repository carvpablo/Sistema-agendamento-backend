"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidIdSchema = exports.UpdateUserSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "The name must be a least 2 characters longs"),
    email: zod_1.z.email("Invalid email format "),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
exports.UpdateUserSchema = exports.UserSchema.partial();
exports.ValidIdSchema = zod_1.z.object({
    id: zod_1.z.uuid("Invalid Id"),
});
