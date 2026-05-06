import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDocumentAsync, DocumentPickerSuccessResult } from 'expo-document-picker';

export default function InputFile() {
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const handlePickFile = async () => {
    try {
      const result = await getDocumentAsync({
        type: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      });
      if ('uri' in result) {
        setSelectedFile(result);
      }
    } catch (err) {
      console.error('Error picking file:', err);
    }
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Input File Event</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* DROPDOWN */}
      <TouchableOpacity style={styles.dropdown}>
        <Text style={styles.dropdownText}>Masukkan Nama Event</Text>
        <Ionicons name="chevron-down" size={18} color="#5C2C00" />
      </TouchableOpacity>

      {/* Upload Area */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Upload File</Text>
          
          <TouchableOpacity style={styles.uploadBox} onPress={handlePickFile}>
            <Ionicons name="cloud-upload-outline" size={48} color="#E67E22" />
            <Text style={styles.uploadText}>Klik untuk upload file</Text>
            <Text style={styles.uploadSubtext}>
              Support: PDF, Excel (xls, xlsx)
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text" size={20} color="#E67E22" />
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile?.name || selectedFile?.uri?.split('/').pop() || 'Unknown file'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Auto Mapping Info */}
        <View style={styles.autoMappingCard}>
          <Ionicons name="sync-outline" size={22} color="#E67E22" />
          <View style={styles.autoMappingTextContainer}>
            <Text style={styles.autoMappingTitle}>Auto Mapping Active</Text>
            <Text style={styles.autoMappingText}>
              Sistem akan otomatis membaca data dari file Excel (tanggal, lokasi, PIC) dan memetakan ke penyimpanan.
            </Text>
          </View>
        </View>
      {/* BUTTON */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Upload & Auto Mapping</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backBtn: {
    backgroundColor: '#FF8F29',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  /* DROPDOWN */
  dropdown: {
    backgroundColor: '#FFFDF0',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  dropdownText: {
    color: '#5C2C00',
  },

  /* UPLOAD CARD */
  uploadCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 3,
  },

  dashedBox: {
    width: '100%',
    height: 160,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#5C2C00',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadIcon: {
    position: 'absolute',
    top: '45%',
  },

  /* BUTTON */
  button: {
    backgroundColor: '#FF8F29',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  formGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginBottom: 10,
  },

  uploadBox: {
    backgroundColor: '#FFFDF0',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#5C2C00',
  },

  uploadText: {
    fontSize: 16,
    color: '#E67E22',
    marginTop: 10,
  },

  uploadSubtext: {
    fontSize: 12,
    color: '#5C2C00',
    marginTop: 5,
  },

  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },

  fileName: {
    flex: 1,
    marginLeft: 10,
    color: '#5C2C00',
  },

  autoMappingCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },

  autoMappingTextContainer: {
    marginLeft: 10,
    flex: 1,
  },

  autoMappingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E67E22',
  },

  autoMappingText: {
    fontSize: 14,
    color: '#5C2C00',
    marginTop: 5,
  },
});