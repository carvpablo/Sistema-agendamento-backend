import app from "../app";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import prisma from "../lib/prisma";
import request from "supertest";
import generateToken from "../lib/jwt";
import bcrypt from "bcrypt";

describe("Appointment Controller Endpoints", () => {
  const clientEmail = "teste.client.appt@example.com";
  const professionalEmail = "teste.prof.appt@example.com";

  let clientId: string;
  let clientToken: string;
  let professionalId: string;
  let professionalToken: string;
  let serviceId: string;
  let futureStartAt: Date;

  beforeEach(async () => {
    // Limpeza
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { client: { email: clientEmail } },
          { professional: { email: professionalEmail } },
        ],
      },
    });
    await prisma.availability.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.professionalService.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.service.deleteMany({
      where: { name: "Corte Cabelo Appt Teste" },
    });
    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });
    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });

    const hashedPassword = await bcrypt.hash("senha123", 10);

    // 1. Cria Cliente
    const client = await prisma.client.create({
      data: {
        name: "Cliente Appt",
        email: clientEmail,
        password: hashedPassword,
      },
    });
    clientId = client.id;
    clientToken = generateToken(clientId);

    // 2. Cria Profissional
    const prof = await prisma.professional.create({
      data: {
        name: "Profissional Appt",
        email: professionalEmail,
        password: hashedPassword,
      },
    });
    professionalId = prof.id;
    professionalToken = generateToken(professionalId);

    // 3. Cria Serviço de 30 minutos
    const s = await prisma.service.create({
      data: {
        name: "Corte Cabelo Appt Teste",
        durationMinutes: 30,
        price: 60.0,
      },
    });
    serviceId = s.id;

    // Vincula serviço ao profissional
    await prisma.professionalService.create({
      data: {
        professionalId,
        serviceId,
      },
    });

    // 4. Cria Janela de Disponibilidade para daqui a 3 dias (ex: 10:00 às 16:00)
    const availStart = new Date();
    availStart.setDate(availStart.getDate() + 3);
    availStart.setHours(10, 0, 0, 0);

    const availEnd = new Date(availStart);
    availEnd.setHours(16, 0, 0, 0);

    await prisma.availability.create({
      data: {
        professionalId,
        startAt: availStart,
        endAt: availEnd,
      },
    });

    // Horário válido do agendamento (11:00 às 11:30)
    futureStartAt = new Date(availStart);
    futureStartAt.setHours(11, 0, 0, 0);
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { client: { email: clientEmail } },
          { professional: { email: professionalEmail } },
        ],
      },
    });
    await prisma.availability.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.professionalService.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.service.deleteMany({
      where: { name: "Corte Cabelo Appt Teste" },
    });
    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });
    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });
    await prisma.$disconnect();
  });

  // ==========================================
  // POST /appointments
  // ==========================================
  describe("POST /appointments", () => {
    it("deve criar um agendamento com sucesso dentro da disponibilidade", async () => {
      const payload = {
        serviceId,
        professionalId,
        clientId,
        startAt: futureStartAt.toISOString(),
      };

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${clientToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.clientId).toBe(clientId);
      expect(response.body.professionalId).toBe(professionalId);
      expect(response.body.status).toBe("SCHEDULED");

      // Confere no banco
      const inDb = await prisma.appointment.findUnique({
        where: { id: response.body.id },
      });
      expect(inDb).not.toBeNull();
    });

    it("deve retornar 403 se o usuário tentar criar agendamento para outro clientId", async () => {
      const payload = {
        serviceId,
        professionalId,
        clientId: "00000000-0000-0000-0000-000000000000",
        startAt: futureStartAt.toISOString(),
      };

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${clientToken}`)
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "error",
        "Unauthorized to create appointment for another user"
      );
    });

    it("deve retornar 400 se o horário solicitado estiver fora da disponibilidade", async () => {
      const foraDoHorario = new Date(futureStartAt);
      foraDoHorario.setHours(20, 0, 0, 0); // fora da janela (10h - 16h)

      const payload = {
        serviceId,
        professionalId,
        clientId,
        startAt: foraDoHorario.toISOString(),
      };

      const response = await request(app)
        .post("/appointments")
        .set("Authorization", `Bearer ${clientToken}`)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid appointment hour");
    });
  });

  // ==========================================
  // GET /appointments & GET /appointments/:id
  // ==========================================
  describe("GET /appointments", () => {
    let appointmentId: string;

    beforeEach(async () => {
      const appt = await prisma.appointment.create({
        data: {
          clientId,
          professionalId,
          serviceId,
          servicePrice: 60,
          startAt: futureStartAt,
          endAt: new Date(futureStartAt.getTime() + 30 * 60 * 1000),
          status: "SCHEDULED",
        },
      });
      appointmentId = appt.id;
    });

    it("deve listar os agendamentos do usuário autenticado", async () => {
      const response = await request(app)
        .get("/appointments")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((a: any) => a.id === appointmentId)).toBe(true);
    });

    it("deve buscar o agendamento específico por ID", async () => {
      const response = await request(app)
        .get(`/appointments/${appointmentId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", appointmentId);
    });
  });

  // ==========================================
  // PATCH /appointments/:id/cancel
  // ==========================================
  describe("PATCH /appointments/:id/cancel", () => {
    it("deve cancelar o agendamento com sucesso com antecedência maior que 24 horas", async () => {
      const appt = await prisma.appointment.create({
        data: {
          clientId,
          professionalId,
          serviceId,
          servicePrice: 60,
          startAt: futureStartAt, // futuro (+3 dias)
          endAt: new Date(futureStartAt.getTime() + 30 * 60 * 1000),
          status: "SCHEDULED",
        },
      });

      const response = await request(app)
        .patch(`/appointments/${appt.id}/cancel`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "CANCELLED");

      const inDb = await prisma.appointment.findUnique({
        where: { id: appt.id },
      });
      expect(inDb?.status).toBe("CANCELLED");
    });
  });
});
