import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ExpertQuote } from '../../entities/expert-quote.entity';
import { User } from '../../entities/user.entity';
import { CreateExpertQuoteDto } from './dto/create-expert-quote.dto';

@Injectable()
export class ExpertQuoteService {
    private readonly logger = new Logger(ExpertQuoteService.name);

    constructor(
        @InjectRepository(ExpertQuote)
        private readonly quoteRepository: Repository<ExpertQuote>,
    ) {}

    async create(dto: CreateExpertQuoteDto, user?: User): Promise<ExpertQuote> {
        // Check daily limit for users (3/day) and businesses (10/day)
        if (user) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const count = await this.quoteRepository.count({
                where: { userId: user.id, createdAt: MoreThan(today) },
            });
            const isBusiness = user.role === 'vendor';
            if (isBusiness && count >= 10) {
                throw new BadRequestException('Daily limit reached. Businesses can submit up to 10 quotes per day.');
            }
            if (!isBusiness && count >= 3) {
                throw new BadRequestException('Daily limit reached. Users can submit up to 3 quotes per day.');
            }
        }

        const quote = this.quoteRepository.create({
            customerName: dto.customerName,
            customerEmail: dto.customerEmail,
            customerPhone: dto.customerPhone,
            categorySlug: dto.categorySlug,
            categoryName: dto.categoryName,
            description: dto.description,
            preferredContact: dto.preferredContact || 'email',
            city: dto.city,
            userId: user?.id,
        });

        return this.quoteRepository.save(quote);
    }

    async findAll(page = 1, limit = 20): Promise<{ data: ExpertQuote[]; total: number }> {
        const [data, total] = await this.quoteRepository.findAndCount({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    async findOne(id: string): Promise<ExpertQuote> {
        const quote = await this.quoteRepository.findOne({ where: { id } });
        if (!quote) throw new NotFoundException('Expert quote not found');
        return quote;
    }
}
