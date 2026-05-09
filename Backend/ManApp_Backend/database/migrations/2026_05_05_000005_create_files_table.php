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
            $table->id();
            $table->foreignId('event_id')->constrained('events');
            $table->string('form_checklist_sebelum_acara')->nullable();
            $table->foreignId('status_form_checklist_sebelum_acara_id')->constrained('status');
            $table->string('surat_perjanjian_kerjasama')->nullable();
            $table->foreignId('status_surat_perjanjian_kerjasama_id')->constrained('status');
            $table->string('invoice')->nullable();
            $table->foreignId('status_invoice_id')->constrained('status');
            $table->string('lembar_disposisi')->nullable();
            $table->foreignId('status_lembar_disposisi_id')->constrained('status');
            $table->string('surat_izin_loading')->nullable();
            $table->foreignId('status_surat_izin_loading_id')->constrained('status');
            $table->string('form_checklist_setelah_acara')->nullable();
            $table->foreignId('status_form_checklist_setelah_acara_id')->constrained('status');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
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
