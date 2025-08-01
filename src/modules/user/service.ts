import { prisma } from "../../configs/db";
import { User } from "@prisma/client";

export class UserService {
  async createUserFromWhatsApp(data: {
    whatsAppId: string;
    name: string;
  }): Promise<User> {
    // Use WhatsApp number as name for simplicity
    return prisma.user.create({
      data: {
        ...data,
        balance: 1000,
      },
    });
  }
}

export const userService = new UserService();
