import app from "../app";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import prisma from "../lib/prisma";
import request from "supertest";
import generateToken from "../lib/jwt";
import bcrypt from "bcrypt";
import crypto from "crypto";

describe("Client Controller Endpoints", () => {
  const clientEmail = "teste.client.controller@example.com";
  let clientId: string;
  let clientToken: string;

  beforeEach(async () => {
    // Limpa dependências
    await prisma.appointment.deleteMany({
      where: { client: { email: clientEmail } },
    });
    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });

    const hashedPassword = await bcrypt.hash("senha123", 10);
    const client = await prisma.client.create({
      data: {
        name: "Cliente Controller Teste",
        email: clientEmail,
        password: hashedPassword,
      },
    });

    clientId = client.id;
    clientToken = generateToken(clientId);
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: { client: { email: clientEmail } },
    });
    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });
    await prisma.$disconnect();
  });

  // ==========================================
  // GET /clients/:id
  // ==========================================
  describe("GET /clients/:id", () => {
    it("deve retornar 200 e os dados do cliente se autenticado", async () => {
      const response = await request(app)
        .get(`/clients/${clientId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", clientId);
      expect(response.body).toHaveProperty("name", "Cliente Controller Teste");
      expect(response.body).toHaveProperty("email", clientEmail);
    });

    it("deve retornar 401 se não enviar token de autenticação", async () => {
      const response = await request(app).get(`/clients/${clientId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid token");
    });

    it("deve retornar 404 se o id informado for inexistente", async () => {
      const nonExistentId = crypto.randomUUID();

      const response = await request(app)
        .get(`/clients/${nonExistentId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "User not found");
    });

    it("deve retornar 404 se o formato do id for inválido (não UUID)", async () => {
      const response = await request(app)
        .get("/clients/id-invalido-123")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Invalid Id");
    });
  });

  // ==========================================
  // PATCH /clients/:id
  // ==========================================
  describe("PATCH /clients/:id", () => {
    it("deve atualizar os dados do cliente com sucesso", async () => {
      const payload = {
        name: "Nome Atualizado",
      };

      const response = await request(app)
        .patch(`/clients/${clientId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("name", "Nome Atualizado");

      const inDb = await prisma.client.findUnique({ where: { id: clientId } });
      expect(inDb?.name).toBe("Nome Atualizado");
    });

    it("deve retornar 400 se o payload for inválido (nome curto demais)", async () => {
      const response = await request(app)
        .patch(`/clients/${clientId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ name: "A" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid Input");
    });

    it("deve retornar 404 ao tentar atualizar cliente inexistente", async () => {
      const nonExistentId = crypto.randomUUID();

      const response = await request(app)
        .patch(`/clients/${nonExistentId}`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ name: "Outro Nome" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Client not found");
    });
  });

  // ==========================================
  // GET /clients/:id/appointments
  // ==========================================
  describe("GET /clients/:id/appointments", () => {
    it("deve listar os agendamentos do cliente", async () => {
      const response = await request(app)
        .get(`/clients/${clientId}/appointments`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ==========================================
  // DELETE /clients/:id
  // ==========================================
  describe("DELETE /clients/:id", () => {
    it("deve deletar o cliente com sucesso", async () => {
      const response = await request(app)
        .delete(`/clients/${clientId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "User deleted sucessfully"
      );

      const inDb = await prisma.client.findUnique({ where: { id: clientId } });
      expect(inDb).toBeNull();
    });

    it("deve retornar 404 ao tentar deletar cliente inexistente", async () => {
      const nonExistentId = crypto.randomUUID();

      const response = await request(app)
        .delete(`/clients/${nonExistentId}`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Cliente não encontrado para deleção"
      );
    });
  });
});
