import { Module } from "@nestjs/common";
import { CredentialsController } from "./credentials.controller";
import { CredentialsService } from "./credentials.service";
import { CredentialsRepository } from "./credentials.repository";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CredentialsController],
  providers: [CredentialsService, CredentialsRepository],
  exports: [CredentialsRepository, CredentialsService],
})
export class CredentialsModule {}
