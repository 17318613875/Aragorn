import { HttpModule, Module } from '@nestjs/common';
import { GeneralService } from './general.service';
import { GeneralController } from './general.controller';

@Module({
  imports: [HttpModule],
  controllers: [GeneralController],
  providers: [GeneralService],
})
export class GeneralModule {}
