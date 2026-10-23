export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Sistema de Agendamento API",
    version: "1.0.0",
    description:
      "Documentação completa dos endpoints da API de agendamentos e serviços para clientes e profissionais.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor Local de Desenvolvimento",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Envie o token JWT no cabeçalho Authorization: Bearer <token>",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "jwt_token",
        description: "Cookie httpOnly configurado automaticamente no Login/Signin",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      UserInput: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "João Silva" },
          email: { type: "string", format: "email", example: "joao@email.com" },
          password: { type: "string", format: "password", example: "123456" },
        },
      },
      LoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "joao@email.com" },
          password: { type: "string", format: "password", example: "123456" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "string", example: "User logged successfully" },
          token: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      },
      ServiceInput: {
        type: "object",
        required: ["name", "durationMinutes", "price"],
        properties: {
          name: { type: "string", example: "Corte de Cabelo" },
          durationMinutes: { type: "integer", example: 30 },
          price: { type: "number", example: 50.0 },
        },
      },
      AvailabilityInput: {
        type: "object",
        required: ["startAt", "endAt"],
        properties: {
          startAt: { type: "string", format: "date-time", example: "2026-10-25T09:00:00.000Z" },
          endAt: { type: "string", format: "date-time", example: "2026-10-25T18:00:00.000Z" },
        },
      },
      AppointmentInput: {
        type: "object",
        required: ["clientId", "professionalId", "serviceId", "startAt"],
        properties: {
          clientId: { type: "string", format: "uuid" },
          professionalId: { type: "string", format: "uuid" },
          serviceId: { type: "string", format: "uuid" },
          startAt: { type: "string", format: "date-time", example: "2026-10-25T10:00:00.000Z" },
        },
      },
      UpdateAppointmentStatus: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["COMPLETED", "CANCELLED"] },
        },
      },
    },
  },
  paths: {
    "/auth/user/signin": {
      post: {
        tags: ["Auth - Cliente"],
        summary: "Cadastro de Cliente",
        description: "Cria um novo cliente, gera o JWT e salva o cookie.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserInput" } } },
        },
        responses: {
          201: {
            description: "Cadastrado com sucesso",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          400: { description: "Entrada inválida" },
          409: { description: "Email já cadastrado" },
        },
      },
    },
    "/auth/user/login": {
      post: {
        tags: ["Auth - Cliente"],
        summary: "Login de Cliente",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          200: {
            description: "Logado com sucesso",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          401: { description: "Credenciais inválidas" },
        },
      },
    },
    "/auth/professional/signin": {
      post: {
        tags: ["Auth - Profissional"],
        summary: "Cadastro de Profissional",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserInput" } } },
        },
        responses: {
          201: {
            description: "Cadastrado com sucesso",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          400: { description: "Entrada inválida" },
          409: { description: "Email já cadastrado" },
        },
      },
    },
    "/auth/professional/login": {
      post: {
        tags: ["Auth - Profissional"],
        summary: "Login de Profissional",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginInput" } } },
        },
        responses: {
          200: {
            description: "Logado com sucesso",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
          },
          401: { description: "Credenciais inválidas" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Limpa o cookie de autenticação jwt_token.",
        responses: {
          200: { description: "Deslogado com sucesso" },
        },
      },
    },
    "/clients/{id}": {
      get: {
        tags: ["Clientes"],
        summary: "Buscar cliente por ID",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Cliente encontrado" },
          404: { description: "Cliente não encontrado" },
        },
      },
      patch: {
        tags: ["Clientes"],
        summary: "Atualizar cliente por ID",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, email: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Atualizado com sucesso" },
          404: { description: "Cliente não encontrado" },
        },
      },
      delete: {
        tags: ["Clientes"],
        summary: "Deletar cliente por ID",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Deletado com sucesso" },
          404: { description: "Cliente não encontrado" },
        },
      },
    },
    "/professionals/{id}": {
      get: {
        tags: ["Profissionais"],
        summary: "Buscar profissional por ID",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Profissional encontrado" },
          404: { description: "Profissional não encontrado" },
        },
      },
      patch: {
        tags: ["Profissionais"],
        summary: "Atualizar perfil profissional",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { name: { type: "string" }, email: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Atualizado com sucesso" },
          403: { description: "Não autorizado" },
        },
      },
      delete: {
        tags: ["Profissionais"],
        summary: "Deletar perfil profissional",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Deletado com sucesso" },
        },
      },
    },
    "/professionals/availability": {
      post: {
        tags: ["Profissionais"],
        summary: "Cadastrar horário de disponibilidade",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AvailabilityInput" } } },
        },
        responses: {
          201: { description: "Disponibilidade criada" },
          400: { description: "Horário inválido" },
        },
      },
    },
    "/professionals/{id}/services": {
      post: {
        tags: ["Profissionais"],
        summary: "Vincular serviço ao profissional",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["serviceId"],
                properties: { serviceId: { type: "string", format: "uuid" } },
              },
            },
          },
        },
        responses: {
          201: { description: "Serviço associado ao profissional" },
          404: { description: "Serviço ou profissional não encontrado" },
        },
      },
    },
    "/professionals/{id}/appointments": {
      get: {
        tags: ["Profissionais"],
        summary: "Listar agendamentos do profissional",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Lista de agendamentos" },
        },
      },
    },
    "/services": {
      get: {
        tags: ["Serviços"],
        summary: "Listar todos os serviços",
        responses: {
          200: { description: "Lista de serviços disponíveis" },
        },
      },
      post: {
        tags: ["Serviços"],
        summary: "Criar novo serviço (Apenas profissional)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ServiceInput" } } },
        },
        responses: {
          201: { description: "Serviço criado e vinculado ao profissional" },
          400: { description: "Entrada inválida" },
        },
      },
    },
    "/services/{id}": {
      get: {
        tags: ["Serviços"],
        summary: "Buscar serviço por ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Serviço encontrado" },
          404: { description: "Serviço não encontrado" },
        },
      },
      patch: {
        tags: ["Serviços"],
        summary: "Atualizar serviço",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  durationMinutes: { type: "integer" },
                  price: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Serviço atualizado" },
          403: { description: "Não autorizado a atualizar esse serviço" },
        },
      },
      delete: {
        tags: ["Serviços"],
        summary: "Deletar serviço",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Serviço deletado" },
          403: { description: "Não autorizado" },
        },
      },
    },
    "/appointments": {
      get: {
        tags: ["Agendamentos"],
        summary: "Listar agendamentos do usuário/profissional autenticado",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: { description: "Lista de agendamentos" },
        },
      },
      post: {
        tags: ["Agendamentos"],
        summary: "Criar novo agendamento",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentInput" } } },
        },
        responses: {
          201: { description: "Agendamento criado com sucesso" },
          400: { description: "Horário inválido ou profissional não atende este serviço" },
          409: { description: "Conflito de horário com outro agendamento" },
        },
      },
    },
    "/appointments/{id}": {
      get: {
        tags: ["Agendamentos"],
        summary: "Buscar agendamento por ID",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          200: { description: "Detalhes do agendamento" },
          403: { description: "Não autorizado a acessar este agendamento" },
          404: { description: "Agendamento não encontrado" },
        },
      },
      patch: {
        tags: ["Agendamentos"],
        summary: "Atualizar status do agendamento (Apenas profissional responsável)",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateAppointmentStatus" } } },
        },
        responses: {
          200: { description: "Status alterado com sucesso" },
          403: { description: "Não autorizado a alterar este agendamento" },
        },
      },
    },
  },
};
