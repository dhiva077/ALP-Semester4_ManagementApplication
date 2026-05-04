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
        Schema::create('files', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('event_id')->constrained('events');
            $table->string('form_checklist_sebelum_acara')->nullable();
            $table->foreignUuid('status_form_checklist_sebelum_acara_id')->constrained('status');
            $table->string('surat_perjanjian_kerjasama')->nullable();
            $table->foreignUuid('status_surat_perjanjian_kerjasama_id')->constrained('status');
            $table->string('invoice')->nullable();
            $table->foreignUuid('status_invoice_id')->constrained('status');
            $table->string('lembar_disposisi')->nullable();
            $table->foreignUuid('status_lembar_disposisi_id')->constrained('status');
            $table->string('surat_izin_loading')->nullable();
            $table->foreignUuid('status_surat_izin_loading_id')->constrained('status');
            $table->string('form_checklist_setelah_acara')->nullable();
            $table->foreignUuid('status_form_checklist_setelah_acara_id')->constrained('status');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->foreignUuid('created_by')->nullable()->constrained('users');
            $table->foreignUuid('updated_by')->nullable()->constrained('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('files');
    }
};
