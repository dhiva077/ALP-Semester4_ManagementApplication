<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Status;
use App\Services\GeminiValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class FileController extends Controller
{
    private const CACHE_KEY = 'files.index';
    private const CACHE_TTL_SECONDS = 30;
    private function attachUrls(File $file, Request $request): File
    {
        $host = $request->getSchemeAndHttpHost();
        $columns = [
            'form_checklist_sebelum_acara',
            'surat_perjanjian_kerjasama',
            'invoice',
            'lembar_disposisi',
            'surat_izin_loading',
            'form_checklist_setelah_acara',
        ];

        foreach ($columns as $column) {
            $path = $file->{$column};
            $file->setAttribute(
                $column . '_url',
                $path ? $host . '/storage/' . ltrim($path, '/') : null
            );
        }

        return $file;
    }

    public function index()
    {
        $files = Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, function () {
            return File::query()
                ->with([
                    'event',
                    'statusFormChecklistSebelumAcara',
                    'statusSuratPerjanjianKerjasama',
                    'statusInvoice',
                    'statusLembarDisposisi',
                    'statusSuratIzinLoading',
                    'statusFormChecklistSetelahAcara',
                ])
                ->orderByDesc('created_at')
                ->get();
        })->map(fn (File $file) => $this->attachUrls($file, request()));

        return response()->json($files);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'integer', 'exists:events,id'],
            'form_checklist_sebelum_acara' => ['nullable', 'string'],
            'status_form_checklist_sebelum_acara_id' => ['nullable', 'integer', 'exists:status,id'],
            'surat_perjanjian_kerjasama' => ['nullable', 'string'],
            'status_surat_perjanjian_kerjasama_id' => ['nullable', 'integer', 'exists:status,id'],
            'invoice' => ['nullable', 'string'],
            'status_invoice_id' => ['nullable', 'integer', 'exists:status,id'],
            'lembar_disposisi' => ['nullable', 'string'],
            'status_lembar_disposisi_id' => ['nullable', 'integer', 'exists:status,id'],
            'surat_izin_loading' => ['nullable', 'string'],
            'status_surat_izin_loading_id' => ['nullable', 'integer', 'exists:status,id'],
            'form_checklist_setelah_acara' => ['nullable', 'string'],
            'status_form_checklist_setelah_acara_id' => ['nullable', 'integer', 'exists:status,id'],
        ]);

        $file = File::create($validated);
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'message' => 'File berhasil dibuat.',
            'file' => $this->attachUrls($file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]), $request),
        ], 201);
    }

    public function show(File $file)
    {
        return response()->json(
            $this->attachUrls($file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]), request())
        );
    }

    public function update(Request $request, File $file)
    {
        $validated = $request->validate([
            'event_id' => ['sometimes', 'required', 'integer', 'exists:events,id'],
            'form_checklist_sebelum_acara' => ['sometimes', 'nullable', 'string'],
            'status_form_checklist_sebelum_acara_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'surat_perjanjian_kerjasama' => ['sometimes', 'nullable', 'string'],
            'status_surat_perjanjian_kerjasama_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'invoice' => ['sometimes', 'nullable', 'string'],
            'status_invoice_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'lembar_disposisi' => ['sometimes', 'nullable', 'string'],
            'status_lembar_disposisi_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'surat_izin_loading' => ['sometimes', 'nullable', 'string'],
            'status_surat_izin_loading_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
            'form_checklist_setelah_acara' => ['sometimes', 'nullable', 'string'],
            'status_form_checklist_setelah_acara_id' => ['sometimes', 'nullable', 'integer', 'exists:status,id'],
        ]);

        $file->fill($validated);
        $file->save();
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'message' => 'File berhasil diupdate.',
            'file' => $this->attachUrls($file->load([
                'event',
                'statusFormChecklistSebelumAcara',
                'statusSuratPerjanjianKerjasama',
                'statusInvoice',
                'statusLembarDisposisi',
                'statusSuratIzinLoading',
                'statusFormChecklistSetelahAcara',
            ]), $request),
        ]);
    }

    public function destroy(File $file)
    {
        // Hapus semua file fisik dari storage sebelum hapus record
        $docColumns = [
            'form_checklist_sebelum_acara',
            'surat_perjanjian_kerjasama',
            'invoice',
            'lembar_disposisi',
            'surat_izin_loading',
            'form_checklist_setelah_acara',
        ];

        foreach ($docColumns as $column) {
            $path = $file->{$column};
            if ($path) {
                Storage::disk('public')->delete($path);
            }
        }

        $file->delete();
        Cache::forget(self::CACHE_KEY);

        return response()->noContent();
    }

    public function upload(Request $request)
    {
        $allowedDocKeys = [
            'form_checklist_sebelum_acara',
            'surat_perjanjian_kerjasama',
            'invoice',
            'lembar_disposisi',
            'surat_izin_loading',
            'form_checklist_setelah_acara',
        ];

        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'pdf_file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'expected_doc_key' => ['nullable', 'string', 'in:' . implode(',', $allowedDocKeys)],
        ]);

        $eventId = $validated['event_id'];
        $pdfFile = $validated['pdf_file'];
        $expectedDocKey = $validated['expected_doc_key'] ?? null;

        // STEP 1: Tentukan tipe dokumen menggunakan VOTING (content-based)
        // expectedDocKey hanya sebagai fallback jika deteksi gagal
        $type = null;
        $aiDetection = null;
        $originalName = $pdfFile->getClientOriginalName();
        $votes = [];

        // Form checklist: skip Gemini (sering timeout/error), pakai parser saja
        $skipFormChecklist = $expectedDocKey && in_array($expectedDocKey, ['form_checklist_sebelum_acara', 'form_checklist_setelah_acara']);

        // --- Detector 1: AI (Gemini) ---
        $aiType = null;
        $aiConfidence = null;
        if (!$skipFormChecklist) {
            try {
                $geminiService = app(GeminiValidationService::class);
                $aiDetection = $geminiService->detectDocumentType(
                    filePath: $pdfFile->getRealPath(),
                    expectedDocKey: $expectedDocKey
                );

                if ($aiDetection['ai_processed'] && $aiDetection['type']) {
                    $aiType = $aiDetection['type'];
                    $aiConfidence = $aiDetection['confidence'];
                    $votes[$aiType] = ($votes[$aiType] ?? 0) + 1;
                }
            } catch (\Exception $e) {
                // AI gagal, lanjut
            }
        }

        // --- Detector 2: Nama File ---
        $filenameType = $this->detectTypeByFilename($originalName);
        if ($filenameType) {
            $votes[$filenameType] = ($votes[$filenameType] ?? 0) + 1;
        }

        // --- Detector 3: Keyword Matching (butuh text dari PDF) ---
        $text = '';
        $keywordType = null;
        $textExtracted = false;
        try {
            $text = $this->extractTextFromPdf($pdfFile->getRealPath());
            $textExtracted = true;
            $keywordType = $this->detectTypeByKeywords($text);
            if ($keywordType) {
                $votes[$keywordType] = ($votes[$keywordType] ?? 0) + 1;
            }
        } catch (\Exception $e) {
            // Ekstraksi teks gagal, lanjut
        }

        // --- Voting Logic ---
        if (!empty($votes)) {
            arsort($votes);
            $topVoteType = array_key_first($votes);
            $topVoteCount = $votes[$topVoteType];

            if ($topVoteCount >= 2) {
                $type = $topVoteType;
            } else {
                if ($aiType && $aiConfidence === 'tinggi') {
                    $type = $aiType;
                } elseif ($filenameType) {
                    $type = $filenameType;
                } elseif ($keywordType) {
                    $type = $keywordType;
                } elseif ($expectedDocKey) {
                    $type = $expectedDocKey;
                } elseif ($aiType) {
                    return response()->json([
                        'message' => 'Jenis dokumen tidak dapat ditentukan dengan pasti. ' .
                            'Coba upload dari halaman checklist atau pastikan nama file sesuai.'
                    ], 400);
                }
            }
        }

        // --- Fallback ke expectedDocKey jika voting gagal ---
        if (!$type && $expectedDocKey) {
            $type = $expectedDocKey;
        }

        // --- Final Keyword Gate: Verifikasi bahwa teks mengandung SEMUA keyword ---
        // untuk tipe yang terdeteksi. Jika tidak cocok, reject. TIDAK ADA auto-correct!
        // Form checklist: skip validasi keyword (template bisa bervariasi)
        if (!$skipFormChecklist && $type && $textExtracted && strlen(trim($text)) > 0) {
            $keywordCheckType = $this->detectTypeByKeywords($text);

            if ($expectedDocKey) {
                // Jika dari checklist, wajib cocok dengan expectedDocKey
                if ($keywordCheckType !== $expectedDocKey) {
                    $label = $this->getTypeLabel($expectedDocKey);
                    return response()->json([
                        'message' => "Dokumen tidak sesuai dengan {$label}. " .
                            'Pastikan Anda mengupload dokumen yang benar.'
                    ], 400);
                }
                // Pastikan type === expectedDocKey
                $type = $expectedDocKey;
            } else {
                // Jika upload bebas, teks harus cocok dengan type hasil voting
                if (!$keywordCheckType) {
                    return response()->json([
                        'message' => 'Dokumen tidak sesuai dengan format yang didukung. ' .
                            'Pastikan Anda mengupload dokumen yang benar (Form Checklist, PKS, Invoice, dll).'
                    ], 400);
                }

                if ($keywordCheckType !== $type) {
                    return response()->json([
                        'message' => 'Jenis dokumen tidak cocok dengan isi file. ' .
                            'Pastikan file yang diupload sesuai dengan jenis yang dipilih.'
                    ], 400);
                }
            }
        }

        // Update aiDetection jika filename atau keywords yang menentukan
        if ($aiDetection && $aiDetection['ai_processed'] && $aiDetection['type'] !== $type) {
            $aiDetection['type'] = $type;
            $aiDetection['is_valid'] = true;
            $aiDetection['confidence'] = 'sedang';
            $aiDetection['explanation'] = 'Deteksi dari nama file/keywords: ' . $originalName;
        }

        // --- Jika masih tidak ada tipe, reject ---
        if (!$type) {
            if ($textExtracted && strlen(trim(preg_replace('/[^a-z0-9]+/i', ' ', strtolower($text)))) < 3) {
                return response()->json([
                    'message' => 'PDF tidak terbaca atau teks terlalu sedikit.'
                ], 400);
            }

            return response()->json([
                'message' => 'Jenis dokumen tidak dikenali. Coba upload dari halaman checklist ' .
                    'atau pastikan nama file sesuai.'
            ], 400);
        }

        $defaultStatusId = Status::where('code', 'B')->value('id');
        $statusColumn = 'status_' . $type . '_id';

        $file = File::where('event_id', $eventId)->first();
        if ($file) {
            $currentStatusId = $file->{$statusColumn} ?? null;
            $hasExistingFile = !empty($file->{$type});
            $isFilled = $currentStatusId !== null
                && (string) $currentStatusId !== (string) $defaultStatusId;

            if ($hasExistingFile && $isFilled) {
                return response()->json([
                    'message' => 'Dokumen sudah ada. Hapus atau ubah dokumen lama terlebih dahulu.',
                    'doc_key' => $type,
                ], 409);
            }
        }

        // STEP 2: Simpan file fisik
        $filename = $eventId . '_' . $type . '_' . time() . '.pdf';
        $path = Storage::disk('public')->putFileAs('files', $pdfFile, $filename);

        // STEP 3: Simpan ke database
        $file = File::firstOrCreate(
            ['event_id' => $eventId],
            [
                'status_form_checklist_sebelum_acara_id' => $defaultStatusId,
                'status_surat_perjanjian_kerjasama_id' => $defaultStatusId,
                'status_invoice_id' => $defaultStatusId,
                'status_lembar_disposisi_id' => $defaultStatusId,
                'status_surat_izin_loading_id' => $defaultStatusId,
                'status_form_checklist_setelah_acara_id' => $defaultStatusId,
            ]
        );

        $file->$type = $path;
        $file->$statusColumn = Status::where('code', 'S')->value('id');

        // Clear revision comment on re-upload
        $commentColumn = 'revisi_' . $type;
        if (in_array($commentColumn, array_keys($file->getAttributes()))) {
            $file->$commentColumn = null;
        }

        // Simpan hasil AI detection (jika AI dipakai sebagai pendeteksi)
        if ($aiDetection && $aiDetection['ai_processed']) {
            $file->ai_valid = $aiDetection['is_valid'] ?? null;
            $file->ai_detected_type = $aiDetection['type'] ?? $type;
            $file->ai_confidence = $aiDetection['confidence'] ?? 'sedang';
            $file->ai_explanation = $aiDetection['explanation'] ?? null;
            $file->ai_processed = true;
        }

        $file->save();
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'message' => 'File berhasil diupload.',
            'type' => $type,
            'filename' => $filename,
            'path' => $path,
            'url' => $request->getSchemeAndHttpHost() . '/storage/' . ltrim($path, '/'),
            'file_type_label' => $this->getTypeLabel($type),
            'ai_detected' => $aiDetection ? $aiDetection['ai_processed'] : false,
            'ai_validation' => $aiDetection ?: [
                'type' => $type,
                'is_valid' => null,
                'confidence' => null,
                'explanation' => 'AI tidak digunakan untuk deteksi (tipe dari checklist).',
                'ai_processed' => false,
                'error' => null,
            ],
        ]);
    }

    /**
     * Detect document type from original filename (fast, no API needed).
     */
    private function detectTypeByFilename(string $filename): ?string
    {
        // Normalize: replace underscores and hyphens with spaces
        $lower = strtolower(str_replace(['_', '-'], ' ', $filename));

        $patterns = [
            'form_checklist_sebelum_acara' => ['form checklist sebelum', 'checklist sebelum', 'pre event', 'sebelum acara', 'persiapan'],
            'surat_perjanjian_kerjasama'   => ['perjanjian kerja sama', 'surat perjanjian', 'pks', 'mou', 'kerjasama'],
            'invoice'                      => ['invoice', 'faktur', 'tagihan', 'kwitansi', 'receipt'],
            'lembar_disposisi'             => ['lembar disposisi', 'pengembalian deposit', 'nominal deposit'],
            'surat_izin_loading'           => ['surat izin loading', 'izin loading', 'loading barang', 'izin bawa'],
            'form_checklist_setelah_acara' => ['form checklist setelah', 'checklist setelah', 'post event', 'setelah acara', 'serah terima', 'berita acara'],
        ];

        foreach ($patterns as $type => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($lower, $keyword)) {
                    return $type;
                }
            }
        }

        return null;
    }

    /**
     * Extract text from PDF using smalot/pdfparser.
     */
    private function extractTextFromPdf(string $filePath): string
    {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);
            return $pdf->getText();
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * Detect document type using keyword matching on extracted text.
     *
     * WAJIB: SEMUA keyword untuk satu tipe harus ADA di teks.
     * Tidak cukup hanya 1 keyword cocok — harus semua keyword terpenuhi.
     * Setiap tipe memiliki minimal 5 keyword unik agar tidak tertukar.
     */
    private function detectTypeByKeywords(string $text): ?string
    {
        $documentMappings = [
            'form_checklist_sebelum_acara' => [
                'form checklist',
                'sebelum acara',
                'sebelum pemakaian lapangan',
                'kondisi',
                'checklist kondisi',
            ],
            'invoice' => [
                'invoice',
                'sewa lapangan',
                'total pembayaran',
                'masa sewa',
                'biaya pemakaian lapangan',
                'nomor invoice',
            ],
            'surat_perjanjian_kerjasama' => [
                'perjanjian kerja sama',
                'penggunaan fasilitas',
                'pihak pertama',
                'pihak kedua',
                'pasal',
                'tempat acara',
                'jangka waktu',
                'biaya pemakaian',
                'ditandatangani',
            ],
            'lembar_disposisi' => [
                'pengambilan deposit',
                'nominal deposit',
                'total pengembalian',
                'diajukan oleh',
                'disetujui oleh',
                'rekening',
                'pemilik rekening',
            ],
            'surat_izin_loading' => [
                'surat izin loading',
                'loading barang',
                'hari tanggal',
                'barang yang dibawa',
                'fasilitas pendukung',
                'izin loading',
            ],
            'form_checklist_setelah_acara' => [
                'form checklist',
                'setelah acara',
                'serah terima',
                'kondisi',
                'checklist kondisi',
            ],
        ];

        // Normalize text: lowercase, replace non-alphanumeric with spaces,
        // collapse multiple spaces (so "izin_loading" and "hari/tanggal" normalize properly)
        $normalized = strtolower($text);
        $normalized = preg_replace('/[^a-z0-9 ]+/', ' ', $normalized);
        $normalized = trim(preg_replace('/\s+/', ' ', $normalized));

        foreach ($documentMappings as $type => $keywords) {
            $allFound = true;
            foreach ($keywords as $keyword) {
                // Normalize keyword: lowercase, non-alphanumeric → space
                $normalizedKeyword = trim(preg_replace('/[^a-z0-9 ]+/', ' ', strtolower($keyword)));
                if (!str_contains($normalized, $normalizedKeyword)) {
                    $allFound = false;
                    break;
                }
            }
            if ($allFound) {
                return $type;
            }
        }

        return null;
    }

    /**
     * Get human-readable label for document type.
     */
    private function getTypeLabel(string $type): string
    {
        $labels = [
            'form_checklist_sebelum_acara' => 'Form Checklist Sebelum Acara',
            'surat_perjanjian_kerjasama' => 'Surat Perjanjian Kerjasama',
            'invoice' => 'Invoice',
            'lembar_disposisi' => 'Lembar Disposisi',
            'surat_izin_loading' => 'Surat Izin Loading',
            'form_checklist_setelah_acara' => 'Form Checklist Setelah Acara',
        ];
        return $labels[$type] ?? ucfirst(str_replace('_', ' ', $type));
    }

    public function updateStatus(Request $request)
    {
        $allowedDocKeys = [
            'form_checklist_sebelum_acara',
            'surat_perjanjian_kerjasama',
            'invoice',
            'lembar_disposisi',
            'surat_izin_loading',
            'form_checklist_setelah_acara',
        ];

        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'doc_key' => ['required', 'string', 'in:' . implode(',', $allowedDocKeys)],
            'status_code' => ['required', 'string', 'in:B,R,S'], // B = Belum, R = Revisi, S = Selesai
            'comment' => ['nullable', 'string'],
        ]);

        $eventId = $validated['event_id'];
        $docKey = $validated['doc_key'];
        $statusCode = $validated['status_code'];
        $comment = $validated['comment'] ?? null;

        $file = File::where('event_id', $eventId)->first();

        if (!$file) {
            return response()->json(['message' => 'File belum diunggah untuk event ini.'], 404);
        }

        $statusColumn = 'status_' . $docKey . '_id';
        $statusId = Status::where('code', $statusCode)->value('id');

        $file->$statusColumn = $statusId;

        // Handle revision comment
        $commentColumn = 'revisi_' . $docKey;
        if ($statusCode === 'R') {
            $file->$commentColumn = $comment;
        } else if ($statusCode === 'S') {
            // Optional: clear comment when marked finished
            $file->$commentColumn = null;
        }

        if ($statusCode === 'B') {
            // Hapus file fisik dari storage
            $filePath = $file->{$docKey};
            if ($filePath) {
                Storage::disk('public')->delete($filePath);
            }
            $file->$docKey = null;
            $file->$commentColumn = null;
        }
        $file->save();
        Cache::forget(self::CACHE_KEY);

        return response()->json([
            'message' => 'Status berhasil diperbarui.',
            'status_code' => $statusCode
        ]);
    }

    public function aiValidate(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['required', 'exists:events,id'],
            'doc_key' => ['required', 'string'],
        ]);

        $file = File::where('event_id', $validated['event_id'])->first();

        if (!$file) {
            return response()->json(['message' => 'File tidak ditemukan untuk event ini.'], 404);
        }

        $docKey = $validated['doc_key'];
        $filePath = $file->{$docKey};

        if (!$filePath) {
            return response()->json(['message' => 'Dokumen belum diupload.'], 404);
        }

        $fullPath = Storage::disk('public')->path($filePath);

        if (!file_exists($fullPath)) {
            return response()->json(['message' => 'File fisik tidak ditemukan di storage.'], 404);
        }

        try {
            $geminiService = app(GeminiValidationService::class);
            $aiValidation = $geminiService->detectDocumentType(
                filePath: $fullPath,
                expectedDocKey: $docKey
            );

            // Simpan hasil ke database
            $file->ai_valid = $aiValidation['is_valid'] ?? null;
            $file->ai_detected_type = $aiValidation['type'] ?? $docKey;
            $file->ai_confidence = $aiValidation['confidence'] ?? 'rendah';
            $file->ai_explanation = $aiValidation['explanation'] ?? null;
            $file->ai_processed = $aiValidation['ai_processed'] ?? false;
            $file->save();

            Cache::forget(self::CACHE_KEY);

            return response()->json([
                'message' => 'AI validation berhasil.',
                'ai_validation' => $aiValidation,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memvalidasi dengan AI: ' . $e->getMessage(),
                'ai_validation' => [
                    'type' => null,
                    'is_valid' => null,
                    'confidence' => null,
                    'explanation' => 'Error: ' . $e->getMessage(),
                    'ai_processed' => false,
                    'error' => $e->getMessage(),
                ],
            ], 500);
        }
    }

}
