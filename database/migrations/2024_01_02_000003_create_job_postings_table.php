<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('company_name');
            $table->string('company_logo')->nullable();
            $table->string('location');
            $table->string('job_type'); // full_time, part_time, contract, remote
            $table->string('experience_level'); // entry, mid, senior
            $table->text('description');
            $table->text('requirements')->nullable();
            $table->decimal('salary_min', 10, 2)->nullable();
            $table->decimal('salary_max', 10, 2)->nullable();
            $table->string('salary_currency', 3)->default('PHP');
            $table->string('application_email')->nullable();
            $table->string('application_url')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status', ['active', 'closed', 'draft'])->default('active');
            $table->integer('views')->default(0);
            $table->json('skills_required')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
