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
        if (!Schema::hasTable('conversations')) {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['direct', 'group', 'support'])->default('direct');
            $table->string('name')->nullable(); // For group chats
            $table->text('description')->nullable(); // Group description
            $table->string('avatar_path')->nullable(); // Group avatar
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->boolean('is_support_ticket')->default(false);
            $table->enum('support_status', ['open', 'in_progress', 'resolved', 'closed'])->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('type');
            $table->index('is_support_ticket');
            $table->index('support_status');
            $table->index('created_at');
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
