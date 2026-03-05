import { DynamicModule, Module } from '@nestjs/common';
import { HubService } from './hub.service';
import { RunnerService } from './runner.service';
import { CLI_OPTIONS, CLIOptions } from './cli-options';

@Module({})
export class AppModule {
  static forRoot(options: CLIOptions): DynamicModule {
    return {
      module: AppModule,
      controllers: [],
      providers: [
        HubService,
        RunnerService,
        {
          provide: CLI_OPTIONS,
          useValue: options,
        },
      ],
      exports: [RunnerService, HubService],
    };
  }
}
