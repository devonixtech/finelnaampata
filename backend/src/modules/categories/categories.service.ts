import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike, Brackets } from 'typeorm';
import { Category, CategoryStatus, CategorySource } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateSlug } from '../../common/utils/slug.util';
import { SearchService } from '../search/search.service';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        private readonly searchService: SearchService,
    ) { }

    /**
     * Ensure a Google category exists (auto-sync)
     */
    async ensureGoogleCategory(name: string): Promise<Category> {
        const slug = generateSlug(name);

        // Check for existing category by slug or name (case-insensitive)
        let category = await this.categoryRepository.findOne({
            where: [{ slug: slug }, { name: ILike(name) }],
        });

        if (!category) {
            // Create new Google category
            category = this.categoryRepository.create({
                name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
                slug,
                source: CategorySource.GOOGLE,
                status: CategoryStatus.ACTIVE,
                icon: this.mapGoogleTypeToIcon(slug),
            });
            category = await this.categoryRepository.save(category);
        }

        return category;
    }

    /**
     * Map common Google place types to icons
     */
    private mapGoogleTypeToIcon(slug: string): string {
        const mapping: Record<string, string> = {
            // Food & Drink
            'restaurant': 'ChefHat',
            'food': 'ChefHat',
            'cafe': 'Coffee',
            'bar': 'Beer',
            'bakery': 'Croissant',
            'liquor_store': 'Wine',
            'meal_delivery': 'Truck',
            'meal_takeaway': 'ShoppingBag',

            // Health & Wellness
            'hospital': 'Stethoscope',
            'health': 'Stethoscope',
            'doctor': 'UserRound',
            'dentist': 'Smile',
            'pharmacy': 'Pill',
            'drugstore': 'Pill',
            'gym': 'Activity',
            'fitness_center': 'Activity',
            'spa': 'Sparkles',
            'beauty_salon': 'Sparkles',
            'hair_care': 'Scissors',

            // Lodging & Travel
            'hotel': 'Building',
            'lodging': 'Building',
            'airport': 'Plane',
            'bus_station': 'Bus',
            'train_station': 'Train',
            'subway_station': 'TramFront',
            'transit_station': 'Milestone',
            'travel_agency': 'Globe',

            // Shopping
            'shopping_mall': 'ShoppingBag',
            'store': 'Store',
            'clothing_store': 'Shirt',
            'department_store': 'Building2',
            'electronics_store': 'Cpu',
            'furniture_store': 'Armchair',
            'jewelry_store': 'Gem',
            'supermarket': 'ShoppingCart',
            'convenience_store': 'ShoppingBasket',
            'grocery_or_supermarket': 'ShoppingCart',
            'shoe_store': 'Footprints',
            'home_goods_store': 'Home',

            // Services
            'bank': 'Landmark',
            'atm': 'CreditCard',
            'insurance_agency': 'ShieldCheck',
            'real_estate_agency': 'Home',
            'car_dealer': 'CarFront',
            'car_rental': 'Key',
            'car_repair': 'Wrench',
            'car_wash': 'CloudRain',
            'gas_station': 'Fuel',
            'laundry': 'Waves',
            'locksmith': 'Lock',
            'moving_company': 'Truck',
            'painter': 'Palette',
            'plumber': 'Droplets',
            'electrician': 'Zap',
            'post_office': 'Mail',
            'veterinary_care': 'PawPrint',

            // Education & Public
            'school': 'GraduationCap',
            'education': 'GraduationCap',
            'university': 'University',
            'library': 'Library',
            'museum': 'Museum',
            'art_gallery': 'Image',
            'park': 'Trees',
            'zoo': 'Bird',
            'aquarium': 'Fish',
            'amusement_park': 'Tickets',
            'stadium': 'Trophy',
            'police': 'ShieldAlert',
            'fire_station': 'Flame',
            'courthouse': 'Gavel',
            'city_hall': 'Building',
            'embassy': 'Flag',
            'local_government_office': 'Briefcase',

            // Religion
            'church': 'Church',
            'mosque': 'MoonStar',
            'hindu_temple': 'Flower',
            'synagogue': 'Star',

            // Entertainment
            'movie_theater': 'Film',
            'night_club': 'Music',
            'casino': 'Coins',
            'bowling_alley': 'Circle',
        };

        return mapping[slug] || 'Tag';
    }

    /**
     * Bulk import Google categories
     */
    async bulkImportGoogleCategories(): Promise<{ count: number }> {
        const types = [
            'restaurant', 'food', 'cafe', 'bar', 'bakery', 'liquor_store', 'meal_delivery', 'meal_takeaway',
            'hospital', 'health', 'doctor', 'dentist', 'pharmacy', 'drugstore', 'gym', 'fitness_center', 'spa', 'beauty_salon', 'hair_care',
            'hotel', 'lodging', 'airport', 'bus_station', 'train_station', 'subway_station', 'transit_station', 'travel_agency',
            'shopping_mall', 'store', 'clothing_store', 'department_store', 'electronics_store', 'furniture_store', 'jewelry_store', 'supermarket', 'convenience_store', 'grocery_or_supermarket', 'shoe_store', 'home_goods_store',
            'bank', 'atm', 'insurance_agency', 'real_estate_agency', 'car_dealer', 'car_rental', 'car_repair', 'car_wash', 'gas_station', 'laundry', 'locksmith', 'moving_company', 'painter', 'plumber', 'electrician', 'post_office', 'veterinary_care',
            'school', 'education', 'university', 'library', 'museum', 'art_gallery', 'park', 'zoo', 'aquarium', 'amusement_park', 'stadium', 'police', 'fire_station', 'courthouse', 'city_hall', 'embassy', 'local_government_office',
            'church', 'mosque', 'hindu_temple', 'synagogue',
            'movie_theater', 'night_club', 'casino', 'bowling_alley'
        ];

        let count = 0;
        for (const type of types) {
            try {
                await this.ensureGoogleCategory(type);
                count++;
            } catch (err) {
                console.error(`Failed to import category: ${type}`, err);
            }
        }

        return { count };
    }

    /**
     * Bulk import categories from `categories-list.json` in repo root.
     * Supports array of strings or objects: { name, slug?, parentName?, description?, icon? }.
     */
    async getCategoriesReviewExport(filePath = join(process.cwd(), 'categories-list.json')) {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new BadRequestException('categories-list.json must be a JSON array');
        }
        return {
            filePath,
            count: parsed.length,
            note:
                'Amend this file, then run POST /categories/admin/bulk-import-file to import approved categories.',
            sample: parsed.slice(0, 25),
        };
    }

    async bulkImportFromFile(filePath = join(process.cwd(), 'categories-list.json')): Promise<{ count: number; created: number; updated: number }> {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            throw new BadRequestException('categories-list.json must be a JSON array');
        }

        let created = 0;
        let updated = 0;

        const byName = new Map<string, Category>();
        const all = await this.categoryRepository.find();
        for (const cat of all) {
            byName.set(cat.name.trim().toLowerCase(), cat);
        }

        const resolveInput = (entry: any) => {
            if (typeof entry === 'string') {
                const cleaned = entry.trim();
                return {
                    name: cleaned.replace(/_/g, ' '),
                    slug: generateSlug(cleaned),
                    source: CategorySource.GOOGLE,
                    status: CategoryStatus.ACTIVE,
                    icon: this.mapGoogleTypeToIcon(generateSlug(cleaned)),
                    description: undefined as string | undefined,
                    parentName: undefined as string | undefined,
                };
            }

            const baseName = String(entry?.name || entry?.slug || '').trim();
            if (!baseName) return null;
            const slug = generateSlug(String(entry.slug || baseName));
            return {
                name: baseName,
                slug,
                source: entry.source || CategorySource.GOOGLE,
                status: entry.status || CategoryStatus.ACTIVE,
                icon: entry.icon || this.mapGoogleTypeToIcon(slug),
                description: entry.description,
                parentName: entry.parentName || entry.parent || undefined,
            };
        };

        // Pass 1: create/update categories without parent relation
        for (const entry of parsed) {
            const input = resolveInput(entry);
            if (!input) continue;

            const nameKey = input.name.trim().toLowerCase();
            let existing = byName.get(nameKey) || await this.categoryRepository.findOne({
                where: [{ slug: ILike(input.slug) }, { name: ILike(input.name) }],
            });

            if (!existing) {
                existing = this.categoryRepository.create({
                    name: input.name,
                    slug: input.slug,
                    source: input.source,
                    status: input.status,
                    icon: input.icon,
                    description: input.description,
                });
                existing = await this.categoryRepository.save(existing);
                created++;
            } else {
                let changed = false;
                if (!existing.icon && input.icon) { existing.icon = input.icon; changed = true; }
                if (!existing.description && input.description) { existing.description = input.description; changed = true; }
                if (existing.status !== CategoryStatus.ACTIVE) { existing.status = CategoryStatus.ACTIVE; changed = true; }
                if (changed) {
                    await this.categoryRepository.save(existing);
                    updated++;
                }
            }

            byName.set(nameKey, existing);
        }

        // Pass 2: parent assignments
        for (const entry of parsed) {
            const input = resolveInput(entry);
            if (!input || !input.parentName) continue;
            const child = byName.get(input.name.trim().toLowerCase());
            const parent = byName.get(String(input.parentName).trim().toLowerCase());
            if (!child || !parent || child.id === parent.id) continue;
            if (child.parentId !== parent.id) {
                child.parentId = parent.id;
                await this.categoryRepository.save(child);
                updated++;
            }
        }

        return { count: created + updated, created, updated };
    }

    async syncGoogleBusinessProfileCategories(params?: {
        languageCode?: string;
        regionCode?: string;
        pageSize?: number;
        writeReviewFile?: boolean;
    }): Promise<{
        fetched: number;
        created: number;
        updated: number;
        reviewFilePath?: string;
    }> {
        const accessToken = process.env.GOOGLE_BUSINESS_ACCESS_TOKEN;
        if (!accessToken) {
            throw new BadRequestException(
                'GOOGLE_BUSINESS_ACCESS_TOKEN is missing. Set this env var and retry.',
            );
        }

        const languageCode = params?.languageCode || 'en';
        const regionCode = params?.regionCode || 'PK';
        const pageSize = Math.min(Math.max(params?.pageSize || 200, 1), 200);

        const normalizedNames = new Set<string>();
        const categories: Array<{
            name: string;
            slug: string;
            source: CategorySource;
            status: CategoryStatus;
            description?: string;
            icon?: string;
        }> = [];

        let nextPageToken: string | undefined;
        do {
            const query = new URLSearchParams({
                languageCode,
                regionCode,
                pageSize: String(pageSize),
            });
            if (nextPageToken) query.set('pageToken', nextPageToken);

            const url = `https://mybusinessbusinessinformation.googleapis.com/v1/categories?${query.toString()}`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new BadRequestException(
                    `Google Business categories fetch failed (${res.status}): ${errText}`,
                );
            }

            const data = await res.json() as {
                categories?: Array<{
                    categoryId?: string;
                    displayName?: string;
                    serviceTypes?: Array<{ serviceTypeId?: string; displayName?: string }>;
                }>;
                nextPageToken?: string;
            };

            for (const item of data.categories || []) {
                if (!item.displayName) continue;
                const normalized = item.displayName.trim().toLowerCase();
                if (!normalized || normalizedNames.has(normalized)) continue;
                normalizedNames.add(normalized);
                const slug = generateSlug(item.displayName);
                categories.push({
                    name: item.displayName.trim(),
                    slug,
                    source: CategorySource.GOOGLE,
                    status: CategoryStatus.ACTIVE,
                    icon: this.mapGoogleTypeToIcon(slug),
                    description: item.categoryId ? `googleCategoryId:${item.categoryId}` : undefined,
                });
            }

            nextPageToken = data.nextPageToken || undefined;
        } while (nextPageToken);

        let created = 0;
        let updated = 0;
        for (const incoming of categories) {
            let existing = await this.categoryRepository.findOne({
                where: [{ slug: ILike(incoming.slug) }, { name: ILike(incoming.name) }],
            });

            if (!existing) {
                existing = this.categoryRepository.create(incoming);
                await this.categoryRepository.save(existing);
                created++;
                continue;
            }

            let changed = false;
            if (!existing.icon && incoming.icon) {
                existing.icon = incoming.icon;
                changed = true;
            }
            if (!existing.description && incoming.description) {
                existing.description = incoming.description;
                changed = true;
            }
            if (existing.status !== CategoryStatus.ACTIVE) {
                existing.status = CategoryStatus.ACTIVE;
                changed = true;
            }
            if (changed) {
                await this.categoryRepository.save(existing);
                updated++;
            }
        }

        let reviewFilePath: string | undefined;
        if (params?.writeReviewFile !== false) {
            const reviewDir = join(process.cwd(), 'tmp');
            await mkdir(reviewDir, { recursive: true });
            reviewFilePath = join(
                reviewDir,
                `google-business-categories-${regionCode.toLowerCase()}-${languageCode.toLowerCase()}.json`,
            );
            await writeFile(reviewFilePath, JSON.stringify(categories, null, 2), 'utf-8');
        }

        return {
            fetched: categories.length,
            created,
            updated,
            reviewFilePath,
        };
    }

    /**
     * Create a new category
     */
    async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
        const { name, parentId, slug: providedSlug, source } = createCategoryDto;

        // Use provided slug or generate from name
        const slug = providedSlug || generateSlug(name);

        // Check if slug or name already exists
        const existingCategory = await this.categoryRepository.findOne({
            where: [{ name: ILike(name) }, { slug: ILike(slug) }],
        });

        if (existingCategory) {
            throw new ConflictException('Category with this name or slug already exists');
        }

        // Verify parent category exists if parentId provided
        if (parentId) {
            const parentCategory = await this.categoryRepository.findOne({
                where: { id: parentId },
            });

            if (!parentCategory) {
                throw new NotFoundException('Parent category not found');
            }
        }

        // Create category
        const category = this.categoryRepository.create({
            ...createCategoryDto,
            slug,
            source: source || CategorySource.ADMIN,
        });

        return this.categoryRepository.save(category);
    }

    /**
     * Get all categories with pagination and search (Admin)
     */
    async findAllAdmin(page = 1, limit = 10, search = ''): Promise<{ data: Category[], total: number }> {
        const queryBuilder = this.categoryRepository
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.parent', 'parent')
            .orderBy('category.displayOrder', 'ASC')
            .addOrderBy('category.name', 'ASC');

        if (search) {
            queryBuilder.where(
                'category.name ILike :search OR category.slug ILike :search',
                { search: `%${search}%` }
            );
        }

        const [data, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return { data, total };
    }

    /**
     * Get active categories (Public)
     */
    async findAllActive(includeSubcategories = false): Promise<Category[]> {
        const queryBuilder = this.categoryRepository
            .createQueryBuilder('category')
            .where('category.status = :status', { status: CategoryStatus.ACTIVE })
            .orderBy('category.displayOrder', 'ASC')
            .addOrderBy('category.name', 'ASC');

        if (includeSubcategories) {
            queryBuilder.leftJoinAndSelect('category.subcategories', 'subcategories', 'subcategories.status = :active', { active: CategoryStatus.ACTIVE });
        }

        return queryBuilder.getMany();
    }

    /**
     * Get root categories (no parent) - ACTIVE ONLY
     */
    async findRootCategories(activeOnly = true): Promise<Category[]> {
        const where: any = { parentId: IsNull() };
        if (activeOnly) {
            where.status = CategoryStatus.ACTIVE;
        }

        return this.categoryRepository.find({
            where,
            relations: ['subcategories'],
            order: {
                displayOrder: 'ASC',
                name: 'ASC',
            },
        });
    }

    /**
     * Get category tree (hierarchical structure) - ACTIVE ONLY
     */
    async getCategoryTree(activeOnly = true): Promise<Category[]> {
        const where: any = { parentId: IsNull() };
        if (activeOnly) {
            where.status = CategoryStatus.ACTIVE;
        }

        const rootCategories = await this.categoryRepository.find({
            where,
            order: {
                displayOrder: 'ASC',
                name: 'ASC',
            },
        });

        // Load subcategories recursively
        for (const category of rootCategories) {
            await this.loadSubcategories(category, activeOnly);
        }

        return rootCategories;
    }

    /**
     * Load subcategories recursively
     */
    private async loadSubcategories(category: Category, activeOnly: boolean): Promise<void> {
        const where: any = { parentId: category.id };
        if (activeOnly) {
            where.status = CategoryStatus.ACTIVE;
        }

        const subcategories = await this.categoryRepository.find({
            where,
            order: {
                displayOrder: 'ASC',
                name: 'ASC',
            },
        });

        category.subcategories = subcategories;

        // Recursively load subcategories for each subcategory
        for (const subcategory of subcategories) {
            await this.loadSubcategories(subcategory, activeOnly);
        }
    }

    /**
     * Get category by ID
     */
    async findOne(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['parent', 'subcategories', 'businesses'],
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        return category;
    }

    /**
     * Get category by slug
     */
    async findBySlug(slug: string): Promise<Category> {
        const category = await this.categoryRepository.findOne({
            where: {
                slug: ILike(slug.trim()),
                status: CategoryStatus.ACTIVE
            },
            relations: ['parent', 'subcategories', 'businesses'],
        });

        if (!category) {
            throw new NotFoundException('Active category not found');
        }

        return category;
    }

    /**
     * Update category
     */
    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);

        // Update slug if name changed and slug not provided
        if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
            if (!updateCategoryDto.slug) {
                const slug = generateSlug(updateCategoryDto.name);

                // Check if new slug already exists
                const existingCategoryBySlug = await this.categoryRepository.findOne({
                    where: { slug: ILike(slug) },
                });

                if (existingCategoryBySlug && existingCategoryBySlug.id !== id) {
                    throw new ConflictException('Category with this name already exists');
                }

                updateCategoryDto['slug'] = slug;
            }
        }

        // If specific slug provided, check for uniqueness
        if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
            const existingCategoryBySlug = await this.categoryRepository.findOne({
                where: { slug: ILike(updateCategoryDto.slug) },
            });

            if (existingCategoryBySlug && existingCategoryBySlug.id !== id) {
                throw new ConflictException('Category with this slug already exists');
            }
        }

        // Verify parent category exists if parentId changed
        if (updateCategoryDto.parentId) {
            // Prevent circular reference
            if (updateCategoryDto.parentId === id) {
                throw new BadRequestException('Category cannot be its own parent');
            }

            const parentCategory = await this.categoryRepository.findOne({
                where: { id: updateCategoryDto.parentId },
            });

            if (!parentCategory) {
                throw new NotFoundException('Parent category not found');
            }

            // Check if new parent is a descendant of current category
            const isDescendant = await this.isDescendant(id, updateCategoryDto.parentId);
            if (isDescendant) {
                throw new BadRequestException(
                    'Cannot set a descendant category as parent (circular reference)',
                );
            }
        }

        await this.categoryRepository.update(id, updateCategoryDto);

        return this.findOne(id);
    }

    /**
     * Update category status
     */
    async updateStatus(id: string, status: CategoryStatus): Promise<Category> {
        const category = await this.findOne(id);
        category.status = status;
        return this.categoryRepository.save(category);
    }


    /**
     * Check if a category is a descendant of another
     */
    private async isDescendant(ancestorId: string, categoryId: string): Promise<boolean> {
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
        });

        if (!category || !category.parentId) {
            return false;
        }

        if (category.parentId === ancestorId) {
            return true;
        }

        return this.isDescendant(ancestorId, category.parentId);
    }

    /**
     * Delete category
     */
    async remove(id: string): Promise<void> {
        const category = await this.categoryRepository.findOne({
            where: { id },
            relations: ['subcategories', 'businesses'],
        });

        if (!category) {
            throw new NotFoundException('Category not found');
        }

        // Check if category has subcategories
        if (category.subcategories && category.subcategories.length > 0) {
            throw new BadRequestException(
                'Cannot delete category with subcategories. Delete subcategories first.',
            );
        }

        // Check if category has businesses
        if (category.businesses && category.businesses.length > 0) {
            throw new BadRequestException(
                'Cannot delete category with businesses. Reassign businesses first.',
            );
        }

        await this.categoryRepository.remove(category);
    }

    /**
     * Get popular categories (by business count, prioritized by isFeatured)
     */
    async getPopularCategories(limit = 10): Promise<any[]> {
        const query = this.categoryRepository
            .createQueryBuilder('category')
            .leftJoin('category.businesses', 'business', 'business.status = :status', { status: 'approved' })
            .where('category.status = :isActive', { isActive: CategoryStatus.ACTIVE })
            .select([
                'category.id',
                'category.name',
                'category.slug',
                'category.icon',
                'category.image_url',
                'category.description'
            ])
            .addSelect('COUNT(business.id)', 'businessCount')
            .groupBy('category.id')
            .orderBy('COUNT(business.id)', 'DESC')
            .addOrderBy('category.name', 'ASC')
            .limit(limit);

        const results = await query.getRawMany();

        return results.map(res => ({
            id: res.category_id,
            name: res.category_name,
            slug: res.category_slug,
            icon: res.category_icon,
            imageUrl: res.category_image_url,
            description: res.category_description,
            businessCount: parseInt(res.businessCount || '0'),
        }));
    }

    /**
     * Smart Category Suggestion (AI-driven via Elasticsearch)
     */
    async suggestCategories(title: string, description: string): Promise<any[]> {
        const query = `${title} ${description}`.trim();
        if (!query) return [];

        let suggestedIds: string[] = [];

        // 1. Try to find similar businesses in ES to see what categories they use
        if (this.searchService.isAvailable()) {
            try {
                const results = await this.searchService.search({ query });
                // Extract categories from similar businesses
                const catNames = results
                    .map((r: any) => r.category)
                    .filter((c: any) => !!c);
                
                if (catNames.length > 0) {
                    // Find those categories in DB
                    const matchedCats = await this.categoryRepository.find({
                        where: catNames.map((name: string) => ({ name: ILike(`%${name}%`) })),
                        take: 5
                    });
                    suggestedIds = matchedCats.map(c => c.id);
                }
            } catch (err) {
                console.error('[CategoriesService] ES Suggestion Error:', err);
            }
        }

        // 2. Keyword matching against Category names and descriptions
        const keywords = query.split(/\s+/).filter(k => k.length > 3);
        const keywordMatches = await this.categoryRepository
            .createQueryBuilder('category')
            .where('category.status = :status', { status: CategoryStatus.ACTIVE })
            .andWhere(
                new Brackets(qb => {
                    keywords.forEach((k, i) => {
                        qb.orWhere(`category.name ILIKE :k${i}`, { [`k${i}`]: `%${k}%` });
                        qb.orWhere(`category.description ILIKE :k${i}`, { [`k${i}`]: `%${k}%` });
                    });
                })
            )
            .limit(5)
            .getMany();

        const combinedSuggestions = [...keywordMatches];
        
        // Add ES matches if they are not already in the list
        if (suggestedIds.length > 0) {
            const existingIds = new Set(combinedSuggestions.map(c => c.id));
            const esMatches = await this.categoryRepository.findByIds(suggestedIds);
            for (const match of esMatches) {
                if (!existingIds.has(match.id)) {
                    combinedSuggestions.push(match);
                }
            }
        }

        return combinedSuggestions.slice(0, 5).map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            icon: c.icon
        }));
    }
}
