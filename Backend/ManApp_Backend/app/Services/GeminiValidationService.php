<?php

namespace App\Services;

use Gemini\Data\Blob;
use Gemini\Data\UploadedFile;
use Gemini\Enums\MimeType;
use Gemini\Laravel\Facades\Gemini;

class GeminiValidationService
{
    /**
     * Document type labels in Indonesian.
     */
    private const DOCUMENT_LABELS = [
        'form_checklist_sebelum_acara' => 'Form Checklist Sebelum Acara (Pre-Event Checklist)',
        'surat_perjanjian_kerjasama' => 'Surat Perjanjian Kerjasama / PKS (Partnership Agreement)',
        'invoice' => 'Invoice / Faktur / Tagihan Pembayaran',
        'lembar_disposisi' => 'Lembar Disposisi (Disposition Letter / Deposit Refund)',
        'surat_izin_loading' => 'Surat Izin Loading (Loading Permit / Work Permit)',
        'form_checklist_setelah_acara' => 'Form Checklist Setelah Acara (Post-Event Checklist)',
    ];

    /**
     * WAJIB: Setiap tipe dokumen punya keyword wajib yang HARUS ADA di PDF.
     * AI akan memvalidasi bahwa SEMUA keyword ini ada sebelum dokumen diterima.
     */
    private const REQUIRED_KEYWORDS = [
        'form_checklist_sebelum_acara' => [
            'form checklist',
            'sebelum acara',
            'sebelum pemakaian lapangan',
            'kondisi',
            'checklist kondisi',
        ],
        'surat_perjanjian_kerjasama' => [
            'perjanjian kerja sama',
            'penggunaan fasilitas',
            'pihak pertama',
            'pihak kedua',
            'tempat acara',
            'pasal',
            'jangka waktu',
            'biaya pemakaian',
            'ditandatangani',
        ],
        'invoice' => [
            'invoice',
            'sewa lapangan',
            'total pembayaran',
            'masa sewa',
            'biaya pemakaian lapangan',
            'nomor invoice',
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
            'hari/tanggal',
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

    /**
     * Maximum file size in bytes for using inline Blob (faster).
     */
    private const MAX_BLOB_SIZE_BYTES = 5 * 1024 * 1024;

    /**
     * Detect document type AND validate all required keywords using Gemini AI.
     *
     * @param string $filePath Absolute path to the PDF file
     * @param string|null $expectedDocKey Expected document type key (optional)
     * @return array{type: string|null, is_valid: bool|null, confidence: string|null, explanation: string|null, ai_processed: bool, error: string|null, keyword_check: array|null}
     */
    public function detectDocumentType(string $filePath, ?string $expectedDocKey = null): array
    {
        try {
            $fileSize = filesize($filePath);

            if ($fileSize <= self::MAX_BLOB_SIZE_BYTES) {
                return $this->detectWithBlob($filePath, $expectedDocKey);
            }

            return $this->detectWithFileApi($filePath, $expectedDocKey);

        } catch (\Exception $e) {
            return [
                'type' => null,
                'is_valid' => null,
                'confidence' => null,
                'explanation' => 'AI Error: ' . $e->getMessage(),
                'ai_processed' => false,
                'error' => $e->getMessage(),
                'keyword_check' => null,
            ];
        }
    }

    /**
     * Detect using inline base64 Blob (fast, for files < 5MB).
     */
    private function detectWithBlob(string $filePath, ?string $expectedDocKey): array
    {
        $base64Pdf = base64_encode(file_get_contents($filePath));
        $prompt = $this->buildPrompt($expectedDocKey);

        $result = Gemini::generativeModel(model: 'gemini-1.5-flash')
            ->generateContent(
                $prompt,
                new Blob(
                    mimeType: MimeType::APPLICATION_PDF,
                    data: $base64Pdf,
                )
            );

        $responseText = $result->text() ?? '';
        return $this->parseResponse($responseText, $expectedDocKey);
    }

    /**
     * Detect using File API (for larger files > 5MB).
     */
    private function detectWithFileApi(string $filePath, ?string $expectedDocKey): array
    {
        $uploadedFile = Gemini::files()->upload(
            filename: $filePath,
            mimeType: MimeType::APPLICATION_PDF,
        );

        $fileUri = $uploadedFile->uri;
        $this->waitForFileReady($fileUri);

        $prompt = $this->buildPrompt($expectedDocKey);

        $result = Gemini::generativeModel(model: 'gemini-1.5-flash')
            ->generateContent(
                $prompt,
                new UploadedFile(
                    fileUri: $fileUri,
                    mimeType: MimeType::APPLICATION_PDF,
                )
            );

        try {
            Gemini::files()->delete($fileUri);
        } catch (\Exception $e) {
            // Ignore cleanup errors
        }

        $responseText = $result->text() ?? '';
        return $this->parseResponse($responseText, $expectedDocKey);
    }

    /**
     * Build prompt with SPECIFIC required keywords that MUST be found in the PDF.
     */
    private function buildPrompt(?string $expectedDocKey): string
    {
        $docTypes = "";
        foreach (self::DOCUMENT_LABELS as $key => $label) {
            $docTypes .= "- `{$key}`: {$label}\n";
        }

        if ($expectedDocKey && isset(self::DOCUMENT_LABELS[$expectedDocKey])) {
            $expectedLabel = self::DOCUMENT_LABELS[$expectedDocKey];
            $keywords = self::REQUIRED_KEYWORDS[$expectedDocKey] ?? [];

            $keywordList = "";
            foreach ($keywords as $kw) {
                $keywordList .= "  - \"{$kw}\"\n";
            }

            return <<<PROMPT
Validasi PDF ini. Dokumen yang diharapkan: {$expectedLabel}.

KEYWORD WAJIB (semua harus ada):
{$keywordList}

JAWAB JSON:
{"detected_type":"{$expectedDocKey}","is_valid":true/false,"confidence":"tinggi/sedang/rendah","all_keywords_found":true/false,"missing_keywords":["keyword1"],"explanation":"Alasan max 15 kata"}

ATURAN:
- is_valid = true HANYA jika SEMUA keyword di atas ADA di dokumen
- all_keywords_found = false jika ada keyword yang tidak ditemukan
- missing_keywords: daftar keyword yang TIDAK ditemukan
- Jika ragu, is_valid = false
- Baca judul, header, isi, footer dengan teliti
PROMPT;
        }

        // Auto-detection mode - detect type based on document content
        // Each type has specific distinguishing features
        $typeDescriptions = [
            'form_checklist_sebelum_acara' => 'Form Checklist SEBELUM. Judul: "FORM CHECKLIST" + "SEBELUM". Isi: tabel ceklis kondisi venue, kolom (No, Item, Kondisi).',
            'form_checklist_setelah_acara' => 'Form Checklist SETELAH. Judul: "FORM CHECKLIST" + "SETELAH" / "SERAH TERIMA". Isi: tabel ceklis kondisi setelah acara.',
            'surat_perjanjian_kerjasama' => 'Perjanjian Kerjasama/PKS. Judul: "PERJANJIAN KERJA SAMA". Isi: pasal-pasal hukum, pihak pertama/kedua, tanda tangan + materai.',
            'invoice' => 'Invoice/Tagihan. Judul: "INVOICE". Isi: rincian biaya sewa, total tagihan Rp, nomor invoice, masa sewa.',
            'lembar_disposisi' => 'Lembar Disposisi. Judul: "LEMBAR DISPOSISI". Isi: nominal deposit, pengembalian deposit, rekening bank.',
            'surat_izin_loading' => 'Surat Izin Loading. Judul: "SURAT IZIN LOADING". Isi: daftar barang dibawa, hari/tanggal, fasilitas pendukung.',
        ];

        $typeDescStr = implode("\n", $typeDescriptions);

        return <<<PROMPT
Tentukan jenis dokumen event dari PDF ini.

PILIHAN:
{$typeDescStr}

JAWAB JSON INI SAJA:
{"detected_type":"kunci_jenis","confidence":"tinggi/sedang/rendah","explanation":"Alasan singkat max 15 kata"}

ATURAN:
- detected_type: pilih yang PALING COCOK dengan JUDUL dan ISI
- confidence: TINGGI jika judul jelas, SEDANG jika isi mendukung, RENDAH jika ragu
- Jika ragu/tidak yakin → confidence "rendah"
- JANGAN asal pilih. Baca judul HALAMAN PERTAMA dulu
- Perhatikan: "SEBELUM" vs "SETELAH" untuk form checklist
- Perhatikan: "deposit/rekening" = disposisi, "barang/hari/tanggal" = izin loading
PROMPT;
    }

    /**
     * Wait for uploaded file to become ACTIVE.
     */
    private function waitForFileReady(string $fileUri, int $maxRetries = 10, int $delayMs = 1000): void
    {
        for ($i = 0; $i < $maxRetries; $i++) {
            $metadata = Gemini::files()->metadataGet($fileUri);
            if ($metadata->state === 'ACTIVE') {
                return;
            }
            if ($metadata->state === 'FAILED') {
                throw new \RuntimeException('File upload to Gemini failed.');
            }
            usleep($delayMs * 1000);
        }
        throw new \RuntimeException('Timeout waiting for Gemini file processing.');
    }

    /**
     * Parse AI response and validate keyword completeness.
     */
    private function parseResponse(string $text, ?string $expectedDocKey): array
    {
        $json = trim($text);

        // Remove markdown code blocks
        if (preg_match('/```(?:json)?\s*(\{.*?\})\s*```/s', $text, $matches)) {
            $json = $matches[1];
        } elseif (preg_match('/\{.*"detected_type".*\}/s', $text, $matches)) {
            $json = $matches[0];
        }

        $data = json_decode($json, true);

        if (!is_array($data) || !isset($data['detected_type'])) {
            $type = $expectedDocKey;
            return [
                'type' => $type,
                'is_valid' => $expectedDocKey ? false : true,
                'confidence' => 'rendah',
                'explanation' => 'AI tidak memberikan respons terstruktur. Respons mentah: ' . mb_substr($text, 0, 150),
                'ai_processed' => true,
                'error' => 'parse_failed',
                'keyword_check' => null,
            ];
        }

        $detectedType = $data['detected_type'] ?? $expectedDocKey;

        // Validate detected type is one of the known types
        if ($detectedType && !isset(self::DOCUMENT_LABELS[$detectedType])) {
            $detectedType = $expectedDocKey;
        }

        // Check keywords if we have an expected document type
        $allKeywordsFound = $data['all_keywords_found'] ?? null;
        $missingKeywords = $data['missing_keywords'] ?? [];
        $isValid = isset($data['is_valid']) ? (bool) $data['is_valid'] : ($expectedDocKey ? false : true);

        // If expected doc key and AI says keywords are missing, force invalid
        if ($expectedDocKey && $allKeywordsFound === false) {
            $isValid = false;
        }

        // If expected doc key and no keyword check returned, do local validation
        if ($expectedDocKey && $allKeywordsFound === null) {
            $keywords = self::REQUIRED_KEYWORDS[$expectedDocKey] ?? [];
            // We can't do local keyword check without text, so trust AI's is_valid
        }

        // Build keyword check result
        $keywordCheck = $expectedDocKey ? [
            'all_found' => $allKeywordsFound,
            'missing' => is_array($missingKeywords) ? $missingKeywords : [],
        ] : null;

        return [
            'type' => $detectedType,
            'is_valid' => $isValid,
            'confidence' => $data['confidence'] ?? 'rendah',
            'explanation' => $data['explanation'] ?? 'Tidak ada penjelasan.',
            'ai_processed' => true,
            'error' => null,
            'keyword_check' => $keywordCheck,
        ];
    }

    /**
     * Get required keywords for a document type.
     */
    public static function getRequiredKeywords(string $docKey): array
    {
        return self::REQUIRED_KEYWORDS[$docKey] ?? [];
    }

    /**
     * Get all document type keys.
     */
    public static function getAllowedDocKeys(): array
    {
        return array_keys(self::DOCUMENT_LABELS);
    }
}
