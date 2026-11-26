import prisma from "../config/prisma";
import type { RegisterInput } from "../validators/authValidator";

export function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
}

export function findUserByEmailForLogin(email: string) {
    return prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            createdAt: true,
        },
    });
}

export function findUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
}

export function createUser(data: RegisterInput & { passwordHash: string }) {
    const now = new Date();

    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: "CUSTOMER",
            createdAt: now,
            updatedAt: now,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
}
