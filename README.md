# Agendamentos! — Back-End API

API RESTful do sistema **Agendamentos!**, responsável pela autenticação de clientes e profissionais, gerenciamento de catálogo de serviços, janelas de disponibilidade, cálculo de horários livres sem conflito e ciclo de vida completo dos agendamentos.

---

## Sumário

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura e Estrutura de Pastas](#arquitetura-e-estrutura-de-pastas)
- [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
- [Regras de Negócio](#regras-de-negócio)
- [Configuração e Variáveis de Ambiente](#configuração-e-variáveis-de-ambiente)
- [Como Executar](#como-executar)
  - [Execução Local](#execução-local)
  - [Execução com Docker](#execução-com-docker)
- [Documentação Interativa (Swagger)](#documentação-interativa-swagger)
- [Endpoints da API](#endpoints-da-api)
- [Testes Automatizados](#testes-automatizados)

---

## Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Runtime & Linguagem** | Node.js 22+ · TypeScript |
| **Framework Web** | Express 5 |
| **ORM & Banco de Dados** | Prisma ORM 6 · PostgreSQL |
| **Validação de Dados** | Zod |
| **Autenticação & Segurança** | JSON Web Token (`jsonwebtoken`) via Cookie `HttpOnly` / Header `Authorization` · `bcrypt` |
| **Documentação da API** | Swagger UI (`swagger-ui-express`) |
| **Testes Automatizados** | Vitest · Supertest |

---

## Arquitetura e Estrutura de Pastas

```text
back-end/
├── controllers/              # Controladores com a lógica de cada domínio
│   ├── appointmentController.ts
│   ├── authController.ts
│   ├── clientController.ts
│   ├── professionalController.ts
│   └── serviceController.ts
├── docs/
│   └── swagger.ts            # Especificação OpenAPI 3.0 servida em /api-docs
├── lib/
│   ├── jwt.ts                # Geração e assinatura de tokens JWT
│   └── prisma.ts             # Instância singleton do PrismaClient
├── middleware/
│   ├── validateProfessional.ts # Garante que o usuário autenticado é um Profissional
│   └── validateToken.ts        # Valida JWT via cookie (jwt_token) ou Bearer token
├── prisma/
│   ├── migrations/           # Histórico de migrações SQL do PostgreSQL
│   └── schema.prisma         # Modelos e relacionamentos do banco de dados
├── routes/                   # Definição de rotas Express por recurso
│   ├── appointmentRoutes.ts
│   ├── authRoutes.ts
│   ├── clientsRoutes.ts
│   ├── professionalsRoutes.ts
│   └── servicesRoutes.ts
├── schemas/                  # Schemas de validação Zod
│   ├── appointmentSchema.ts
│   ├── authSchema.ts
│   ├── clientSchema.ts
│   ├── professionalSchema.ts
│   └── serviceSchema.ts
├── tests/                    # Testes de integração (Vitest + Supertest)
│   ├── appointment.test.ts
│   ├── auth.test.ts
│   ├── client.test.ts
│   ├── professional.test.ts
│   └── service.test.ts
├── app.ts                    # Configuração principal do Express, CORS e rotas
├── Dockerfile                # Build multi-stage para produção
└── package.json
```

---

## Modelagem do Banco de Dados

O banco PostgreSQL é gerenciado pelo Prisma (`prisma/schema.prisma`) e possui cinco entidades principais:

- **`Client`**: Clientes que contratam e agendam serviços (`id`, `name`, `email`, `password`).
- **`Professional`**: Prestadores de serviço (`id`, `name`, `email`, `password`).
- **`Service`**: Serviços ofertados na plataforma (`id`, `name`, `description`, `durationMinutes`, `price`).
- **`ProfessionalService`**: Tabela associativa (`@@unique([serviceId, professionalId])`) que vincula profissionais aos serviços que eles executam.
- **`Availability`**: Janelas de atendimento abertas pelo profissional (`id`, `professionalId`, `startAt`, `endAt`).
- **`Appointment`**: Agendamentos realizados (`id`, `clientId`, `professionalId`, `serviceId`, `servicePrice`, `startAt`, `endAt`, `status`: `SCHEDULED` | `COMPLETED` | `CANCELLED`).

---

## Regras de Negócio

1. **Separação estrita de papéis (`Client` vs. `Professional`):**
   - Rotas de criação/edição/exclusão de serviços e disponibilidades exigem o middleware `validateProfessional`, que verifica se o `id` extraído do token JWT pertence a um registro válido na tabela `Professional`.
   - Apenas o profissional proprietário de um serviço ou disponibilidade pode alterá-lo ou excluí-lo.
2. **Validação de disponibilidade no futuro e sem sobreposição:**
   - Não é permitido cadastrar janelas de disponibilidade no passado (`startAt > agora`) nem com `endAt <= startAt`.
   - O sistema bloqueia o cadastro de janelas de disponibilidade que se sobreponham a outra janela já existente do mesmo profissional.
3. **Cálculo inteligente de slots disponíveis (`GET /professionals/:id/available-slots`):**
   - Divide cada janela de `Availability` do profissional em blocos compatíveis com a duração do serviço (`durationMinutes`), filtrando automaticamente horários que conflitem com agendamentos ativos (`SCHEDULED`).
4. **Prevenção de conflitos de agendamento (`POST /appointments`):**
   - Verifica se o profissional executa o serviço, se o horário solicitado está integralmente contido dentro de uma janela de disponibilidade do profissional e se não há colisão com outro agendamento `SCHEDULED`.
   - Congela o preço do serviço no momento da reserva no campo `servicePrice`.
5. **Política de cancelamento com antecedência mínima de 24 horas (`PATCH /appointments/:id/cancel`):**
   - Apenas agendamentos com status `SCHEDULED` e com mais de **24 horas de antecedência** em relação ao `startAt` podem ser cancelados pelo cliente.

---

## Configuração e Variáveis de Ambiente

Crie um arquivo `.env` na pasta `back-end/` com as seguintes variáveis:

```env
# URL de conexão com o banco de dados PostgreSQL
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_agendamento?schema=public"

# Chave secreta para assinatura e verificação dos tokens JWT
SECRET="sua_chave_secreta_jwt_aqui"

# Porta do servidor Express (padrão: 3000)
PORT=3000

# Origens permitidas no CORS (separadas por vírgula se houver mais de uma)
CORS_ORIGIN="http://localhost:3001"
```

---

## Como Executar

### Execução Local

1. **Instale as dependências:**
   ```bash
   cd back-end
   npm install
   ```

2. **Execute as migrações do banco e gere o Prisma Client:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Inicie o servidor em modo de desenvolvimento (com hot-reload via `tsx`):**
   ```bash
   npm run dev
   ```
   A API estará disponível em `http://localhost:3000`.

4. **Build para produção:**
   ```bash
   npm run build
   npm start
   ```

### Execução com Docker

```bash
cd back-end
docker build -t agendamentos-backend .
docker run -p 3000:3000 --env-file .env agendamentos-backend
```

---

## Documentação Interativa (Swagger)

Com o servidor em execução, acesse a documentação interativa OpenAPI 3.0 no navegador:

```text
http://localhost:3000/api-docs
```

---

## Endpoints da API

### Autenticação (`/auth`)

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/user/signin` | Público | Cadastra um novo cliente e define o cookie `jwt_token` |
| `POST` | `/auth/user/login` | Público | Autentica um cliente e define o cookie `jwt_token` |
| `POST` | `/auth/professional/signin` | Público | Cadastra um novo profissional e define o cookie `jwt_token` |
| `POST` | `/auth/professional/login` | Público | Autentica um profissional e define o cookie `jwt_token` |
| `POST` | `/auth/logout` | Público | Limpa o cookie de sessão `jwt_token` |

### Serviços (`/services`)

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/services` | Público | Lista todos os serviços ativos com seus profissionais vinculados |
| `GET` | `/services/:id` | Público | Retorna os detalhes de um serviço específico pelo ID |
| `POST` | `/services` | Profissional | Cria um novo serviço e o vincula automaticamente ao profissional autenticado |
| `PATCH` | `/services/:id` | Profissional (Dono) | Atualiza nome, descrição, duração ou preço do serviço |
| `DELETE` | `/services/:id` | Profissional (Dono) | Remove o vínculo do serviço do catálogo do profissional |

### Profissionais & Disponibilidade (`/professionals`)

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/professionals/:id` | Público | Retorna os dados públicos de um profissional |
| `GET` | `/professionals/:id/services` | Público | Lista todos os serviços oferecidos por um profissional |
| `GET` | `/professionals/:id/availability` | Público | Lista as janelas de disponibilidade cadastradas pelo profissional |
| `GET` | `/professionals/:id/available-slots` | Público | Calcula os horários livres (`?serviceId=...&date=YYYY-MM-DD`) |
| `GET` | `/professionals/:id/appointments` | Profissional (Dono) | Lista os agendamentos dos clientes para o profissional |
| `POST` | `/professionals/availability` | Profissional | Cadastra uma nova janela de disponibilidade (`startAt`, `endAt`) |
| `DELETE` | `/professionals/availability/:id` | Profissional (Dono) | Remove uma janela de disponibilidade |
| `PATCH` | `/professionals/:id` | Profissional (Dono) | Atualiza os dados cadastrais do profissional |
| `DELETE` | `/professionals/:id` | Profissional (Dono) | Exclui a conta do profissional |

### Clientes (`/clients`)

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/clients/:id` | Autenticado | Retorna os dados do cliente pelo ID |
| `GET` | `/clients/:id/appointments` | Cliente (Dono) | Lista todos os agendamentos do cliente com dados de serviço e profissional |
| `PATCH` | `/clients/:id` | Cliente (Dono) | Atualiza nome, e-mail ou senha do cliente |
| `DELETE` | `/clients/:id` | Cliente (Dono) | Exclui a conta do cliente |

### Agendamentos (`/appointments`)

| Método | Rota | Acesso | Descrição |
| :--- | :--- | :--- | :--- |
| `GET` | `/appointments` | Autenticado | Lista agendamentos do usuário autenticado |
| `GET` | `/appointments/:id` | Autenticado | Consulta detalhes de um agendamento específico |
| `POST` | `/appointments` | Cliente | Cria um novo agendamento validando disponibilidade e conflitos |
| `PATCH` | `/appointments/:id/cancel` | Cliente (Dono) | Cancela um agendamento (`> 24h` antes do início) |
| `PATCH` | `/appointments/:id` | Profissional | Atualiza o status de um agendamento (`SCHEDULED`, `COMPLETED`, `CANCELLED`) |

---

## Testes Automatizados

O back-end conta com testes de integração ponta a ponta utilizando **Vitest** e **Supertest** cobrindo autenticação, clientes, profissionais, serviços e agendamentos.

```bash
# Executar toda a suíte de testes uma vez
npm test

# Executar em modo watch durante o desenvolvimento
npm run test:watch
```
