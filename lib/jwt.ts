import jwt, { SignOptions } from "jsonwebtoken";

export default function generateToken(userId: string) {
  const payload = {
    id: userId,
  };
  const SECRET_KEY = process.env.JWT_SECRET;

  if (!SECRET_KEY) {
    throw new Error("A variável de ambiente JWT_SECRET não está definida.");
  }

  const options: SignOptions = {
    expiresIn: "1h",
    issuer: "minha-api",
    audience: "meu-front",
    subject: userId,
  };

  const token = jwt.sign(payload, SECRET_KEY, options);

  return token;
}
