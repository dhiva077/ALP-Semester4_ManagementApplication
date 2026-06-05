import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface SelectedFile {
  name: string;
  uri: string;
  size?: number | null;
}

export default function useInputFileViewModel() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handlePickFile = async (): Promise<{
    files: SelectedFile[];
    oversized: string[];
    duplicates: string[];
  }> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled) {
        const oversizedFiles: string[] = [];
        const newFiles: SelectedFile[] = [];

        // Kelompokkan file berdasarkan ukuran
        for (const asset of result.assets) {
          const fileSize = asset.size ?? 0;
          if (fileSize > MAX_FILE_SIZE_BYTES) {
            oversizedFiles.push(asset.name);
          } else {
            newFiles.push({
              name: asset.name,
              uri: asset.uri,
              size: asset.size,
            });
          }
        }

        // Deduplikasi: tambahkan hanya file yang belum ada (berdasarkan nama)
        // Cek terhadap file yang sudah ada DAN terhadap file lain dalam batch yang sama
        const duplicateNames: string[] = [];
        const uniqueNewFiles: SelectedFile[] = [];
        const seenNames = new Set(selectedFiles.map(f => f.name.toLowerCase()));

        for (const nf of newFiles) {
          const nameLower = nf.name.toLowerCase();
          if (seenNames.has(nameLower)) {
            duplicateNames.push(nf.name);
          } else {
            seenNames.add(nameLower);
            uniqueNewFiles.push(nf);
          }
        }

        if (uniqueNewFiles.length > 0) {
          setSelectedFiles((prev) => [...prev, ...uniqueNewFiles]);
        }

        if (oversizedFiles.length > 0) {
          setSizeError(oversizedFiles.join(', '));
        } else {
          setSizeError(null);
        }

        return {
          files: newFiles,
          oversized: oversizedFiles,
          duplicates: duplicateNames,
        };
      }

      setSizeError(null);
      return { files: [], oversized: [], duplicates: [] };
    } catch (err) {
      console.error("Gagal mengambil dokumen:", err);
      return { files: [], oversized: [], duplicates: [] };
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFileByUri = (uri: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.uri !== uri));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setSizeError(null);
  };

  const clearSizeError = () => setSizeError(null);

  return {
    selectedFiles,
    sizeError,
    handlePickFile,
    removeFile,
    removeFileByUri,
    clearAllFiles,
    clearSizeError,
  };
}