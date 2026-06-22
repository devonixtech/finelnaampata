import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpertQuoteController } from './expert-quote.controller';
import { ExpertQuoteService } from './expert-quote.service';
import { ExpertQuote } from '../../entities/expert-quote.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ExpertQuote])],
    controllers: [ExpertQuoteController],
    providers: [ExpertQuoteService],
    exports: [ExpertQuoteService],
})
export class ExpertQuoteModule {}
