import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  // 2. Se não achou no header, tenta pegar dos cookies (caso use cookie-parser)
  else if (req.cookies?.jwt_token) {
    token = req.cookies.jwt_token;
  }

  if (!token) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const SECRET_KEY = process.env.JWT_SECRET;
  if (!SECRET_KEY) {
    throw new Error("JWT_SECRET not defined on .env");
  }

  try {
    // 3. Valida a assinatura, expiração e configurações do token
    const decoded = jwt.verify(token, SECRET_KEY, {
      issuer: "minha-api",
      audience: "meu-front",
    }) as TokenPayload;

    // 4. Injeta os dados do usuário na requisição
    req.user = {
      id: decoded.id,
    };

    // 5. Continua para a próxima função / controller
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expirado." });
    }
    return res.status(401).json({ error: "Token inválido." });
  }
};

export default validateToken;
