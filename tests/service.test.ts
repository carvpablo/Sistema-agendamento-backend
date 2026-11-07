import app from "../app";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import prisma from "../lib/prisma";
import request from "supertest";
import generateToken from "../lib/jwt";
import bcrypt from "bcrypt";
import crypto from "crypto";

describe("Service Controller Endpoints", () => {
  const professionalEmail = "teste.prof.service@example.com";
  const clientEmail = "teste.client.service@example.com";

  let professionalId: string;
  let professionalToken: string;
  let clientToken: string;
  let serviceId: string;

  beforeEach(async () => {
    // Limpeza prévia
    await prisma.professionalService.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.appointment.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.service.deleteMany({
      where: { name: { startsWith: "Serviço Teste" } },
    });
    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });
    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });

    const hashedPassword = await bcrypt.hash("senha123", 10);

    // Cria profissional
    const prof = await prisma.professional.create({
      data: {
        name: "Profissional Service Teste",
        email: professionalEmail,
        password: hashedPassword,
      },
    });
    professionalId = prof.id;
    professionalToken = generateToken(professionalId);

    // Cria cliente (usuário comum não-profissional)
    const client = await prisma.client.create({
      data: {
        name: "Cliente Comum",
        email: clientEmail,
        password: hashedPassword,
      },
    });
    clientToken = generateToken(client.id);

    // Cria um serviço vinculado ao profissional
    const service = await prisma.service.create({
      data: {
        name: "Serviço Teste Inicial",
        description: "Descrição de teste",
        durationMinutes: 30,
        price: 50.0,
      },
    });
    serviceId = service.id;

    await prisma.professionalService.create({
      data: {
        professionalId,
        serviceId,
      },
    });
  });

  afterAll(async () => {
    await prisma.professionalService.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.appointment.deleteMany({
      where: { professional: { email: professionalEmail } },
    });
    await prisma.service.deleteMany({
      where: { name: { startsWith: "Serviço Teste" } },
    });
    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });
    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });
    await prisma.$disconnect();
  });

  // ==========================================
  // GET /services
  // ==========================================
  describe("GET /services", () => {
    it("deve listar todos os serviços (rota pública)", async () => {
      const response = await request(app).get("/services");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.some((s: any) => s.id === serviceId)).toBe(true);
    });
  });

  // ==========================================
  // GET /services/:id
  // ==========================================
  describe("GET /services/:id", () => {
    it("deve retornar os detalhes do serviço pelo id", async () => {
      const response = await request(app).get(`/services/${serviceId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", serviceId);
      expect(response.body).toHaveProperty("name", "Serviço Teste Inicial");
    });

    it("deve retornar 400 se o id informado não for um UUID válido", async () => {
      const response = await request(app).get("/services/id-invalido");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid id");
    });
  });

  // ==========================================
  // POST /services
  // ==========================================
  describe("POST /services", () => {
    it("deve permitir que um profissional crie e vincule um novo serviço", async () => {
      const payload = {
        name: "Serviço Teste Novo",
        description: "Nova descrição",
        durationMinutes: 45,
        price: 75.5,
      };

      const response = await request(app)
        .post("/services")
        .set("Authorization", `Bearer ${professionalToken}`)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("name", payload.name);
      expect(response.body).toHaveProperty("id");

      // Confere se o vínculo com o profissional foi criado
      const link = await prisma.professionalService.findUnique({
        where: {
          serviceId_professionalId: {
            serviceId: response.body.id,
            professionalId,
          },
        },
      });
      expect(link).not.toBeNull();
    });

    it("deve rejeitar (401) se um cliente comum tentar criar serviço", async () => {
      const payload = {
        name: "Serviço Teste Invalido",
        description: "Tentativa por cliente",
        durationMinutes: 30,
        price: 40,
      };

      const response = await request(app)
        .post("/services")
        .set("Authorization", `Bearer ${clientToken}`)
        .send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "error",
        "Unauthorized: You must be a professional"
      );
    });

    it("deve retornar 400 se o payload for inválido", async () => {
      const response = await request(app)
        .post("/services")
        .set("Authorization", `Bearer ${professionalToken}`)
        .send({
          name: "", // nome vazio
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input");
    });
  });

  // ==========================================
  // PATCH /services/:id
  // ==========================================
  describe("PATCH /services/:id", () => {
    it("deve atualizar os dados do serviço com sucesso", async () => {
      const response = await request(app)
        .patch(`/services/${serviceId}`)
        .set("Authorization", `Bearer ${professionalToken}`)
        .send({
          name: "Serviço Teste Atualizado",
          price: 90.0,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Serviço Teste Atualizado");
    });

    it("deve retornar 401 se outro profissional tentar atualizar o serviço", async () => {
      // Cria um segundo profissional não-vinculado
      const otherHashed = await bcrypt.hash("senha123", 10);
      const otherProf = await prisma.professional.create({
        data: {
          name: "Outro Profissional",
          email: "outro.prof.service@example.com",
          password: otherHashed,
        },
      });
      const otherToken = generateToken(otherProf.id);

      const response = await request(app)
        .patch(`/services/${serviceId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ name: "Tentativa Não Autorizada" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty(
        "error",
        "Unauthorized to update this service"
      );

      // Limpeza do segundo profissional
      await prisma.professional.delete({ where: { id: otherProf.id } });
    });
  });

  // ==========================================
  // DELETE /services/:id
  // ==========================================
  describe("DELETE /services/:id", () => {
    it("deve desvincular/deletar o serviço do profissional com sucesso", async () => {
      const response = await request(app)
        .delete(`/services/${serviceId}`)
        .set("Authorization", `Bearer ${professionalToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Service deleted successfully"
      );

      const link = await prisma.professionalService.findUnique({
        where: {
          serviceId_professionalId: {
            serviceId,
            professionalId,
          },
        },
      });
      expect(link).toBeNull();
    });
  });
});
