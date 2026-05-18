import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';

interface SelectedFile {
  name: string;
  uri: string;
}

export default function useInputFileViewModel() {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled) {
        // Map semua asset yang dipilih ke state
        const newFiles = result.assets.map((asset) => ({
          name: asset.name,
          uri: asset.uri,
        }));

        // Gabungkan dengan file yang sudah ada sebelumnya
        setSelectedFiles((prev) => [...prev, ...newFiles]);

        return newFiles;
      }

      return [];
    } catch (err) {
      console.error("Gagal mengambil dokumen:", err);
      return [];
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
  };

  return {
    selectedFiles,
    handlePickFile,
    removeFile,
    removeFileByUri,
    clearAllFiles,
  };
}