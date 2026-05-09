<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Status extends Model
{
    /** @use HasFactory */
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'status';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'code' => 'string',
            'status' => 'string',
        ];
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function statusFormChecklistSebelumAcara(): HasOne
    {
        return $this->hasOne(File::class, 'status_form_checklist_sebelum_acara_id');
    }

    public function statusFormChecklistSetelahAcara(): HasOne
    {
        return $this->hasOne(File::class, 'status_form_checklist_setelah_acara_id');
    }

    public function statusSuratPerjanjianKerjasama(): HasOne
    {
        return $this->hasOne(File::class, 'status_surat_perjanjian_kerjasama_id');
    }

    public function statusInvoice(): HasOne
    {
        return $this->hasOne(File::class, 'status_invoice_id');
    }

    public function statusLembarDisposisi(): HasOne
    {
        return $this->hasOne(File::class, 'status_lembar_disposisi_id');
    }

    public function statusSuratIzinLoading(): HasOne
    {
        return $this->hasOne(File::class, 'status_surat_izin_loading_id');
    }
}
