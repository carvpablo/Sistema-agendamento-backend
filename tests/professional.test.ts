import app from "../app";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import prisma from "../lib/prisma";
import request from "supertest";
import generateToken from "../lib/jwt";
import bcrypt from "bcrypt";
import crypto from "crypto";

describe("Professional Controller Endpoints", () => {
  const professionalEmail = "teste.prof.controller@example.com";
  let professionalId: string;
  let professionalToken: string;
  let serviceId: string;

  beforeEach(async () => {
    // Limpeza
    await prisma.availability.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.professionalService.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.appointment.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });
    await prisma.service.deleteMany({
      where: { name: "Serviço Profissional Teste" },
    });

    const hashedPassword = await bcrypt.hash("senha123", 10);
    const prof = await prisma.professional.create({
      data: {
        name: "Profissional Principal",
        email: professionalEmail,
        password: hashedPassword,
      },
    });

    professionalId = prof.id;
    professionalToken = generateToken(professionalId);

    const s = await prisma.service.create({
      data: {
        name: "Serviço Profissional Teste",
        durationMinutes: 30,
        price: 80,
      },
    });
    serviceId = s.id;

    await prisma.professionalService.create({
      data: {
        professionalId,
        serviceId,
      },
    });
  });

  afterAll(async () => {
    await prisma.availability.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.professionalService.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.appointment.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });
    await prisma.service.deleteMany({
      where: { name: "Serviço Profissional Teste" },
    });
    await prisma.$disconnect();
  });

  // ==========================================
  // GET /professionals/:id
  // ==========================================
  describe("GET /professionals/:id", () => {
    it("deve retornar 200 e os dados do profissional", async () => {
      const response = await request(app).get(`/professionals/${professionalId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", professionalId);
      expect(response.body).toHaveProperty("name", "Profissional Principal");
    });

    it("deve retornar 404 se o profissional não for encontrado", async () => {
      const nonExistentId = crypto.randomUUID();
      const response = await request(app).get(`/professionals/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "No professional found");
    });
  });

  // ==========================================
  // GET /professionals/:id/services
  // ==========================================
  describe("GET /professionals/:id/services", () => {
    it("deve retornar a lista de serviços do profissional", async () => {
      const response = await request(app).get(
        `/professionals/${professionalId}/services`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((s: any) => s.id === serviceId)).toBe(true);
    });
  });

  // ==========================================
  // POST & GET /professionals/availability
  // ==========================================
  describe("Disponibilidade do Profissional", () => {
    it("deve criar e listar disponibilidade com sucesso", async () => {
      const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const endAt = new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString();

      // 1. Cria disponibilidade
      const createRes = await request(app)
        .post("/professionals/availability")
        .set("Authorization", `Bearer ${professionalToken}`)
        .send({
          professionalId,
          startAt,
          endAt,
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body).toHaveProperty("id");

      // 2. Consulta disponibilidade
      const getRes = await request(app).get(
        `/professionals/${professionalId}/availability`
      );

      expect(getRes.status).toBe(200);
      expect(Array.isArray(getRes.body)).toBe(true);
      expect(getRes.body.length).toBeGreaterThanOrEqual(1);

      // 3. Deleta a disponibilidade criada
      const availabilityId = createRes.body.id;
      const deleteRes = await request(app)
        .delete(`/professionals/availability/${availabilityId}`)
        .set("Authorization", `Bearer ${professionalToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body).toHaveProperty(
        "message",
        "Availability deleted successfully"
      );
    });

    it("deve calcular available-slots corretamente", async () => {
      // Cria uma janela de 1 hora (2 slots de 30 min)
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 2);
      baseDate.setHours(9, 0, 0, 0);

      const start = new Date(baseDate);
      const end = new Date(baseDate.getTime() + 60 * 60 * 1000); // 1h depois

      await prisma.availability.create({
        data: {
          professionalId,
          startAt: start,
          endAt: end,
        },
      });

      const response = await request(app).get(
        `/professionals/${professionalId}/available-slots?serviceId=${serviceId}`
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Deve gerar exatamente 2 slots (9:00 e 9:30)
      expect(response.body.length).toBe(2);
    });
  });

  // ==========================================
  // PATCH /professionals/:id
  // ==========================================
  describe("PATCH /professionals/:id", () => {
    it("deve atualizar os dados do profissional", async () => {
      const response = await request(app)
        .patch(`/professionals/${professionalId}`)
        .set("Authorization", `Bearer ${professionalToken}`)
        .send({
          name: "Profissional Nome Atualizado",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Profissional Nome Atualizado");
    });
  });
});
