import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      service: 'banking-service',
      status: 'ok',
      graphql: '/graphql',
    };
  }
}
