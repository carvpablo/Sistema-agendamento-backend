"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAppointmentSchema = exports.validateId = exports.createAppointmentSchema = void 0;
const zod_1 = require("zod");
exports.createAppointmentSchema = zod_1.z.object({
    clientId: zod_1.z.uuid(),
    professionalId: zod_1.z.uuid(),
    serviceId: zod_1.z.uuid(),
    startAt: zod_1.z.coerce.date(),
});
exports.validateId = zod_1.z.object({
    id: zod_1.z.uuid(),
});
exports.updateAppointmentSchema = zod_1.z.object({
    status: zod_1.z.enum(["COMPLETED", "CANCELLED"]),
});
