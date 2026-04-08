import { Controller, Get, Delete, Param, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { GetUser } from "@/modules/auth/decorators/get-user.decorator";
import { CredentialsService } from "./credentials.service";
import { CredentialResponseDto } from "./dto/credential-response.dto";

@ApiTags("credentials")
@Controller("credentials")
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Get()
  @ApiOperation({ summary: "List connected credentials for the authenticated user" })
  @ApiOkResponse({ type: [CredentialResponseDto] })
  async getCredentials(@GetUser("id") userId: number) {
    return this.credentialsService.getCredentialsForUser(userId);
  }

  @Delete(":id")
  async revokeCredential(@Param("id") credentialId: number, @GetUser("id") userId: number) {
    return this.credentialsService.revokeCredential(Number(credentialId), userId);
  }
}
