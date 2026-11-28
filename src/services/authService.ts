import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import * as authRepository from "../repositories/authRepository";
import type { RegisterInput, LoginInput } from "../validators/authValidator";

export class AuthServiceError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = "AuthServiceError";
    }
}

export async function register(data: RegisterInput) {
    const email = data.email.toLowerCase();

    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
        throw new AuthServiceError("Email is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    let user;
    try {
        user = await authRepository.createUser({
            ...data,
            email,
            passwordHash,
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            throw new AuthServiceError("Email is already registered", 409);
        }

        throw error;
    }

    const token = jwt.sign(
        {
            sub: String(user.id),
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return { user, token };
}

export async function login(data: LoginInput) {
    const email = data.email.toLowerCase();

    const user = await authRepository.findUserByEmailForLogin(email);

    if (!user) {
        throw new AuthServiceError("Invalid email or password", 401);
    }

    const isPasswordValid = await bcrypt.compare(
        data.password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new AuthServiceError("Invalid email or password", 401);
    }

    const token = jwt.sign(
        {
            sub: String(user.id),
            role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        },
        token,
    };
}
