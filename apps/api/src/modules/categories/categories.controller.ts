import { Controller, Get, Post, Param, Query, Headers, UnauthorizedException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from '../../entities/category.entity';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    async findAll(): Promise<Category[]> {
        return this.categoriesService.findAll();
    }

    @Get('popular')
    async getPopular(@Query('limit') limit: number = 8): Promise<Category[]> {
        return this.categoriesService.getPopular(limit);
    }

    /**
     * Admin-only: Bulk seed 200+ Google Business Categories into the database.
     * Usage: POST /categories/admin/seed-bulk
     * Header: x-admin-key: <ADMIN_SECRET from env>
     * Safe to run multiple times — skips existing slugs.
     */
    @Post('admin/seed-bulk')
    async bulkSeed(@Headers('x-admin-key') adminKey: string): Promise<{ message: string; inserted: number; skipped: number }> {
        const expected = process.env.ADMIN_SECRET || 'naampata-admin-2024';
        if (adminKey !== expected) {
            throw new UnauthorizedException('Invalid admin key');
        }
        const result = await this.categoriesService.bulkSeedCategories();
        return {
            message: `Bulk seed complete`,
            ...result,
        };
    }

    @Get('slug/:slug')
    async findBySlug(@Param('slug') slug: string): Promise<Category | null> {
        return this.categoriesService.findBySlug(slug);
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Category | null> {
        return this.categoriesService.findOne(id);
    }
}
