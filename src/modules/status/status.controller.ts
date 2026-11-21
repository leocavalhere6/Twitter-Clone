import { Controller, Get, Inject } from "@nestjs/common";
import { StatusService, type SystemStatusResponse } from "./status.service";

@Controller("status")
export class StatusController {
  constructor(
    @Inject(StatusService)
    private readonly statusService: StatusService,
  ) {}

  @Get()
  async getStatus(): Promise<SystemStatusResponse> {
    return this.statusService.getStatus();
  }
}
