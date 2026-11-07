import app from "../app";
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import prisma from "../lib/prisma";
import request from "supertest";
import bcrypt from "bcrypt";

describe("Auth Endpoints", () => {
  const clientEmail = "teste.client.auth@example.com";
  const professionalEmail = "teste.prof.auth@example.com";
  const defaultPassword = "password123";

  // Limpeza de segurança antes de cada teste
  beforeEach(async () => {
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { client: { email: clientEmail } },
          { professional: { email: professionalEmail } },
        ],
      },
    });

    await prisma.client.deleteMany({
      where: { email: clientEmail },
    });

    await prisma.professional.deleteMany({
      where: { email: professionalEmail },
    });
  });

  // Limpeza final e desconexão do Prisma após a suíte rodar
  afterAll(async () => {
    await prisma.appointment.deleteMany({
      where: {
        OR: [
          { client: { email: clientEmail } },
          { professional: { email: professionalEmail } },
        ],
      },
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
  // 1. POST /auth/user/signin (Cadastro Cliente)
  // ==========================================
  describe("POST /auth/user/signin", () => {
    it("deve cadastrar um cliente com sucesso, retornar 201, token, cookie e salvar no banco", async () => {
      const payload = {
        name: "Cliente Teste",
        email: clientEmail,
        password: defaultPassword,
      };

      const response = await request(app)
        .post("/auth/user/signin")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("success", "User registered successfully");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        name: payload.name,
        email: payload.email,
      });
      expect(response.headers["set-cookie"]).toBeDefined();

      // Confirmação no banco de dados
      const clientInDb = await prisma.client.findUnique({
        where: { email: clientEmail },
      });
      expect(clientInDb).not.toBeNull();
      expect(clientInDb?.name).toBe(payload.name);
      // Garante que a senha foi gravada criptografada
      expect(clientInDb?.password).not.toBe(payload.password);
    });

    it("deve retornar 400 se os dados de entrada forem inválidos", async () => {
      const payloadInvalido = {
        name: "A", // nome menor que 2 caracteres
        email: "email-invalido",
        password: "123", // senha menor que 6 caracteres
      };

      const response = await request(app)
        .post("/auth/user/signin")
        .send(payloadInvalido);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input");
    });

    it("deve retornar 409 se o email já estiver em uso", async () => {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await prisma.client.create({
        data: {
          name: "Cliente Existente",
          email: clientEmail,
          password: hashedPassword,
        },
      });

      const response = await request(app)
        .post("/auth/user/signin")
        .send({
          name: "Outro Nome",
          email: clientEmail,
          password: defaultPassword,
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error", "Email already in use");
    });
  });

  // ==========================================
  // 2. POST /auth/user/login (Login Cliente)
  // ==========================================
  describe("POST /auth/user/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await prisma.client.create({
        data: {
          name: "Cliente Para Login",
          email: clientEmail,
          password: hashedPassword,
        },
      });
    });

    it("deve realizar login com credenciais válidas e retornar 200 com token e cookie", async () => {
      const response = await request(app)
        .post("/auth/user/login")
        .send({
          email: clientEmail,
          password: defaultPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", "User logged successfully");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        name: "Cliente Para Login",
        email: clientEmail,
      });
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("deve retornar 400 se o email ou senha forem omitidos", async () => {
      const response = await request(app)
        .post("/auth/user/login")
        .send({ email: clientEmail });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input");
    });

    it("deve retornar 401 se o cliente não for encontrado", async () => {
      const response = await request(app)
        .post("/auth/user/login")
        .send({
          email: "nao.existe@example.com",
          password: defaultPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid email or password");
    });

    it("deve retornar 401 se a senha estiver incorreta", async () => {
      const response = await request(app)
        .post("/auth/user/login")
        .send({
          email: clientEmail,
          password: "senha-errada",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid email or password");
    });
  });

  // ==========================================
  // 3. POST /auth/logout (Logout)
  // ==========================================
  describe("POST /auth/logout", () => {
    it("deve retornar 200 e limpar o cookie jwt_token", async () => {
      const response = await request(app).post("/auth/logout");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", "User logged out successfully");
      
      const rawCookies = response.headers["set-cookie"];
      expect(rawCookies).toBeDefined();

      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies as string];
      const jwtCookie = cookies.find((c) => c.includes("jwt_token"));
      expect(jwtCookie).toBeDefined();
      expect(jwtCookie).toMatch(/Max-Age=0|Expires=/i);
    });
  });

  // ========================================================
  // 4. POST /auth/professional/signin (Cadastro Profissional)
  // ========================================================
  describe("POST /auth/professional/signin", () => {
    it("deve cadastrar um profissional com sucesso, retornar 201 e salvar no banco", async () => {
      const payload = {
        name: "Profissional Teste",
        email: professionalEmail,
        password: defaultPassword,
      };

      const response = await request(app)
        .post("/auth/professional/signin")
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "success",
        "Professional registered successfully"
      );
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        name: payload.name,
        email: payload.email,
      });

      // Confirmação no banco de dados
      const profInDb = await prisma.professional.findUnique({
        where: { email: professionalEmail },
      });
      expect(profInDb).not.toBeNull();
      expect(profInDb?.name).toBe(payload.name);
      expect(profInDb?.password).not.toBe(payload.password);
    });

    it("deve retornar 400 se os dados forem inválidos", async () => {
      const response = await request(app)
        .post("/auth/professional/signin")
        .send({
          name: "P",
          email: "invalido",
          password: "123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input");
    });

    it("deve retornar 409 se o email do profissional já estiver cadastrado", async () => {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await prisma.professional.create({
        data: {
          name: "Profissional Existente",
          email: professionalEmail,
          password: hashedPassword,
        },
      });

      const response = await request(app)
        .post("/auth/professional/signin")
        .send({
          name: "Outro Profissional",
          email: professionalEmail,
          password: defaultPassword,
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error", "Email already in use");
    });
  });

  // ========================================================
  // 5. POST /auth/professional/login (Login Profissional)
  // ========================================================
  describe("POST /auth/professional/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await prisma.professional.create({
        data: {
          name: "Profissional Para Login",
          email: professionalEmail,
          password: hashedPassword,
        },
      });
    });

    it("deve realizar login do profissional com sucesso e retornar 200", async () => {
      const response = await request(app)
        .post("/auth/professional/login")
        .send({
          email: professionalEmail,
          password: defaultPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success", "User logged successfully");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toMatchObject({
        name: "Profissional Para Login",
        email: professionalEmail,
      });
      expect(response.headers["set-cookie"]).toBeDefined();
    });

    it("deve retornar 400 se dados obrigatórios forem omitidos", async () => {
      const response = await request(app)
        .post("/auth/professional/login")
        .send({ password: defaultPassword });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Invalid input");
    });

    it("deve retornar 401 se o profissional não for encontrado", async () => {
      const response = await request(app)
        .post("/auth/professional/login")
        .send({
          email: "nao.existe.prof@example.com",
          password: defaultPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid email or password");
    });

    it("deve retornar 401 se a senha do profissional estiver incorreta", async () => {
      const response = await request(app)
        .post("/auth/professional/login")
        .send({
          email: professionalEmail,
          password: "senha-incorreta",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Invalid email or password");
    });
  });
});
