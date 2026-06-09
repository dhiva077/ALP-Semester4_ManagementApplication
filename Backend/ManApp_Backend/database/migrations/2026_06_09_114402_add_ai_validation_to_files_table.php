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
        Schema::table('files', function (Blueprint $table) {
            $table->boolean('ai_valid')->nullable()->after('form_checklist_setelah_acara');
            $table->string('ai_detected_type')->nullable()->after('ai_valid');
            $table->string('ai_confidence')->nullable()->after('ai_detected_type');
            $table->text('ai_explanation')->nullable()->after('ai_confidence');
            $table->boolean('ai_processed')->default(false)->after('ai_explanation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropColumn([
                'ai_valid',
                'ai_detected_type',
                'ai_confidence',
                'ai_explanation',
                'ai_processed',
            ]);
        });
    }
};
