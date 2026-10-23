-- 1. Cria as colunas SEM "NOT NULL" temporariamente
ALTER TABLE "Client" ADD COLUMN "password" TEXT;
ALTER TABLE "Professional" ADD COLUMN "password" TEXT;

-- 2. Preenche os registros que já existem no banco
UPDATE "Client"
SET "password" = '$2a$10$QfyKzwo5356BGUEY/a.hRO2N0Anf8Xth5bRUX195sGct03q4pPome'
WHERE "password" IS NULL;

UPDATE "Professional"
SET "password" = '$2a$10$rf5E93NK5wsVtGQi33lXX..2QFh9nGKfWmd7mBSgi3f.DMxvEzAQa'
WHERE "password" IS NULL;

-- 3. Agora que todos têm valor, torna o campo obrigatório (NOT NULL)
ALTER TABLE "Client" ALTER COLUMN "password" SET NOT NULL;
ALTER TABLE "Professional" ALTER COLUMN "password" SET NOT NULL;
