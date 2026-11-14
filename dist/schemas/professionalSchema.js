"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProfessionalSchema = exports.createServiceProfessionalSchema = exports.AvailabilitySchema = void 0;
const zod_1 = require("zod");
exports.AvailabilitySchema = zod_1.z
    .object({
    startAt: zod_1.z.coerce.date().refine((date) => date.getTime() > Date.now(), {
        message: "A data de início deve ser posterior ao momento atual",
    }),
    endAt: zod_1.z.coerce.date(),
})
    .refine((data) => data.startAt < data.endAt, {
    message: "startAt must be before endAt",
    path: ["endAt"],
});
exports.createServiceProfessionalSchema = zod_1.z.object({
    serviceId: zod_1.z.uuid(),
});
exports.createProfessionalSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "The name must be a least 2 characters longs"),
    email: zod_1.z.email("Invalid email format "),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long"),
});
