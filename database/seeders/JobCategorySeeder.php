<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\JobCategory;

class JobCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Information Technology',
                'slug' => 'information-technology',
                'description' => 'Software development, IT support, network administration, and tech-related roles',
                'icon' => 'Monitor',
                'color' => '#3B82F6',
                'sort_order' => 1,
            ],
            [
                'name' => 'Engineering',
                'slug' => 'engineering',
                'description' => 'Civil, mechanical, electrical, and other engineering disciplines',
                'icon' => 'Wrench',
                'color' => '#10B981',
                'sort_order' => 2,
            ],
            [
                'name' => 'Business & Finance',
                'slug' => 'business-finance',
                'description' => 'Accounting, banking, financial analysis, and business administration',
                'icon' => 'Briefcase',
                'color' => '#6366F1',
                'sort_order' => 3,
            ],
            [
                'name' => 'Education',
                'slug' => 'education',
                'description' => 'Teaching, training, academic research, and educational administration',
                'icon' => 'GraduationCap',
                'color' => '#F59E0B',
                'sort_order' => 4,
            ],
            [
                'name' => 'Healthcare',
                'slug' => 'healthcare',
                'description' => 'Medical, nursing, pharmacy, and healthcare support roles',
                'icon' => 'Heart',
                'color' => '#EF4444',
                'sort_order' => 5,
            ],
            [
                'name' => 'Marketing & Sales',
                'slug' => 'marketing-sales',
                'description' => 'Marketing, advertising, sales, and customer relations',
                'icon' => 'TrendingUp',
                'color' => '#EC4899',
                'sort_order' => 6,
            ],
            [
                'name' => 'Arts & Design',
                'slug' => 'arts-design',
                'description' => 'Graphic design, multimedia arts, creative services',
                'icon' => 'Palette',
                'color' => '#8B5CF6',
                'sort_order' => 7,
            ],
            [
                'name' => 'Government & Public Service',
                'slug' => 'government',
                'description' => 'Government agencies, public administration, and civil service',
                'icon' => 'Building',
                'color' => '#14B8A6',
                'sort_order' => 8,
            ],
            [
                'name' => 'Manufacturing & Production',
                'slug' => 'manufacturing',
                'description' => 'Factory operations, quality control, and production management',
                'icon' => 'Factory',
                'color' => '#F97316',
                'sort_order' => 9,
            ],
            [
                'name' => 'Hospitality & Tourism',
                'slug' => 'hospitality-tourism',
                'description' => 'Hotels, restaurants, travel, and tourism services',
                'icon' => 'Plane',
                'color' => '#06B6D4',
                'sort_order' => 10,
            ],
            [
                'name' => 'Others',
                'slug' => 'others',
                'description' => 'Other job categories not listed above',
                'icon' => 'MoreHorizontal',
                'color' => '#6B7280',
                'sort_order' => 99,
            ],
        ];

        foreach ($categories as $category) {
            JobCategory::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
