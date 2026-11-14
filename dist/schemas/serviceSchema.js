"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateId = exports.updateServiceSchema = exports.createServiceSchema = void 0;
const zod_1 = require("zod");
exports.createServiceSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().max(500).optional(),
    durationMinutes: zod_1.z
        .number()
        .int("Durantion must be a intenger")
        .positive("Durantion must be a positive number"),
    price: zod_1.z.number(),
});
exports.updateServiceSchema = exports.createServiceSchema.partial();
exports.validateId = zod_1.z.object({
    id: zod_1.z.uuid(),
});
