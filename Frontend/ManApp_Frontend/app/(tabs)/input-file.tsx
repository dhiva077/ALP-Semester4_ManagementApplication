import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import useInputFileViewModel from '../../src/viewmodels/useInputFileViewModel';

const MOCK_EVENTS = [
  { id: 'm1', name: 'Webinar Ketua Osis se-Sulawesi', location: 'Dian Auditorium UC Makassar', date: '2026-06-02', pic: 'Dylon' },
  { id: 'm2', name: 'Event Basket MA ARIFAH Gowa', location: 'Lapangan Basket UC Makassar', date: '2026-06-01', pic: 'Dylon' },
  { id: 'm3', name: 'Mayora Goes to Campus', location: 'Classroom A606', date: '2026-06-15', pic: 'Dylon' },
  { id: 'm4', name: 'Natal SD Katolik St. Joseph Rajawali', location: 'Lapangan Basket UC Makassar', date: '2026-07-01', pic: 'Dylon' },
  { id: 'm5', name: 'Wisuda Santri TK/TPA Barokah', location: 'Dian Auditorium UC Makassar Lt7', date: '2026-05-05', pic: 'Dylon' },
  { id: 'm6', name: 'Pameran Buku by Gramedia', location: 'Lapangan Basket UC Makassar', date: '2026-05-10', pic: 'Dylon' },
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const YEARS = ["2024", "2025", "2026", "2027"];

export default function InputFile() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>(MOCK_EVENTS);
  
  // LOGIKA AUTO-DETECT WAKTU SEKARANG
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear().toString());

  const [monthModal, setMonthModal] = useState(false);
  const [yearModal, setYearModal] = useState(false);

  const { selectedFiles, handlePickFile, removeFile, clearAllFiles } = useInputFileViewModel();

  // Memfilter event berdasarkan bulan & tahun yang aktif saat ini
  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const eventDate = new Date(event.date);
      const m = eventDate.getMonth();
      const y = eventDate.getFullYear().toString();
      return m === selectedMonth && y === selectedYear;
    });
  }, [allEvents, selectedMonth, selectedYear]);

  const loadStoredEvents = async () => {
    try {
      const STORAGE_KEY = 'MANAPP_EVENTS';
      const savedEvents = await AsyncStorage.getItem(STORAGE_KEY);
      let mergedData = [...MOCK_EVENTS];
      if (savedEvents) {
        const stored: Record<string, any[]> = JSON.parse(savedEvents);
        Object.entries(stored).forEach(([date, items]) => {
          items.forEach(item => {
            if (!mergedData.find(e => e.name === item.title)) {
              mergedData.push({ id: item.id.toString(), name: item.title, location: item.location, date, pic: 'Dylon' });
            }
          });
        });
      }
      setAllEvents(mergedData);
    } catch (error) { console.error(error); }
  };

  useFocusEffect(
    useCallback(() => {
      loadStoredEvents();
      return () => {
        setIsExpanded(false);
        setSelectedEvent(null);
        clearAllFiles(); 
      };
    }, [clearAllFiles])
  );

  const handleUploadPress = () => {
    if (!selectedEvent) {
      Alert.alert("Perhatian", "Silakan pilih nama event terlebih dahulu.");
      return;
    }
    handlePickFile();
  };

  const renderPickerModal = (visible: boolean, data: string[], onSelect: (val: any, index?: number) => void, onClose: () => void, title: string) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item, index }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item, index)}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Input File Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* PERIODE PICKER (BULAN & TAHUN OTOMATIS) */}
        <Text style={styles.sectionLabel}>Periode Event</Text>
        <View style={styles.compactFilterRow}>
          <TouchableOpacity style={styles.miniSelector} onPress={() => setMonthModal(true)}>
            <Ionicons name="calendar-outline" size={18} color="#FF8C00" />
            <Text style={styles.miniSelectorText}>{MONTHS[selectedMonth]}</Text>
            <Ionicons name="chevron-down" size={14} color="#8D6E63" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.miniSelector} onPress={() => setYearModal(true)}>
            <Ionicons name="time-outline" size={18} color="#FF8C00" />
            <Text style={styles.miniSelectorText}>{selectedYear}</Text>
            <Ionicons name="chevron-down" size={14} color="#8D6E63" />
          </TouchableOpacity>
        </View>

        {/* EVENT SELECTOR */}
        <View style={[styles.section, { zIndex: 100 }]}>
          <Text style={styles.sectionLabel}>Daftar Event</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.selector, isExpanded && styles.selectorActive]} 
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text numberOfLines={1} style={[styles.selectorText, selectedEvent && { color: '#4E342E', fontWeight: 'bold' }]}>
              {selectedEvent ? selectedEvent.name : filteredEvents.length > 0 ? `Pilih dari ${filteredEvents.length} event...` : "Tidak ada event di periode ini"}
            </Text>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#8D6E63" />
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                {filteredEvents.length > 0 ? filteredEvents.map((item, index) => (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.eventItem, index === filteredEvents.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => { setSelectedEvent(item); setIsExpanded(false); }}
                  >
                    <View style={styles.iconCircle}><Ionicons name="calendar" size={16} color="#FF8C00" /></View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.eventItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.eventItemDate}>{item.date} • {item.location}</Text>
                    </View>
                  </TouchableOpacity>
                )) : (
                  <View style={{ padding: 20, alignItems: 'center' }}><Text style={{ color: '#888' }}>Event tidak ditemukan.</Text></View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* INFO CARD */}
        {selectedEvent && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><MaterialCommunityIcons name="account-tie" size={18} color="#8D6E63" /><Text style={styles.infoValue}>PIC: {selectedEvent.pic}</Text></View>
            <View style={styles.infoRow}><Ionicons name="location-outline" size={18} color="#8D6E63" /><Text style={styles.infoValue}>{selectedEvent.location}</Text></View>
          </View>
        )}

        {/* UPLOAD BOX */}
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionLabel}>Upload Berkas</Text>
          <TouchableOpacity 
            style={[styles.uploadBox, selectedFiles.length > 0 && styles.uploadBoxActive]} 
            onPress={handleUploadPress}
          >
            <MaterialCommunityIcons name={selectedFiles.length > 0 ? "file-plus" : "cloud-upload"} size={40} color={selectedFiles.length > 0 ? "#2E7D32" : "#FF8C00"} />
            <Text style={styles.uploadText}>{selectedFiles.length > 0 ? "Tambah Berkas" : "Pilih File Dokumen"}</Text>
          </TouchableOpacity>

          {/* KRITERIA FILE */}
          <View style={styles.criteriaContainer}>
             <Ionicons name="information-circle-outline" size={14} color="#8D6E63" />
             <Text style={styles.fileCriteria}>Kriteria file: PKS_NamaEvent, Invoice_NamaEvent</Text>
          </View>

          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.fileItemCard}>
              <Ionicons name="document-text" size={24} color="#FF8C00" />
              <Text style={styles.fileItemName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => removeFile(index)}><Ionicons name="close-circle" size={22} color="#E53935" /></TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.btnSimpan, (selectedFiles.length === 0 || !selectedEvent) && { opacity: 0.5 }]}
          onPress={() => Alert.alert("Sukses", "Data berhasil disimpan!")}
        >
          <Text style={styles.btnText}>Simpan Berkas</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL PICKERS */}
      {renderPickerModal(monthModal, MONTHS, (val, idx) => { setSelectedMonth(idx!); setSelectedEvent(null); setMonthModal(false); }, () => setMonthModal(false), "Pilih Bulan")}
      {renderPickerModal(yearModal, YEARS, (val) => { setSelectedYear(val); setSelectedEvent(null); setYearModal(false); }, () => setYearModal(false), "Pilih Tahun")}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF5E6' },
  scrollContainer: { paddingHorizontal: 25, paddingBottom: 50 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 10, marginBottom: 10 },
  backButton: { backgroundColor: '#FF9800', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#4E342E' },
  section: { marginTop: 5, position: 'relative' },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#8D6E63', marginBottom: 8, marginTop: 15, textTransform: 'uppercase', letterSpacing: 1 },
  compactFilterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniSelector: { flex: 1, backgroundColor: '#FFF', height: 45, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: '#EEE', elevation: 2, marginHorizontal: 4 },
  miniSelectorText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#4E342E', fontWeight: '600' },
  selector: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, height: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  selectorActive: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  selectorText: { color: '#AAA', fontSize: 14, flex: 1 },
  dropdownContainer: { backgroundColor: '#FFF', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, elevation: 5, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  dropdownScroll: { maxHeight: 180 },
  eventItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F9F9F9' },
  iconCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF5EB', justifyContent: 'center', alignItems: 'center' },
  eventItemName: { fontSize: 14, fontWeight: 'bold', color: '#4E342E' },
  eventItemDate: { fontSize: 11, color: '#888' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginTop: 15, borderLeftWidth: 4, borderLeftColor: '#FF8C00', elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  infoValue: { fontSize: 13, color: '#4E342E', fontWeight: '600', marginLeft: 10 },
  uploadBox: { backgroundColor: '#FFF', borderRadius: 20, height: 140, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#DDD', marginTop: 10, marginBottom: 5 },
  uploadBoxActive: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  uploadText: { marginTop: 8, fontSize: 13, color: '#4E342E', fontWeight: '600' },
  criteriaContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  fileCriteria: { color: '#8D6E63', fontSize: 11, fontStyle: 'italic', marginLeft: 5 },
  fileItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 8, elevation: 2 },
  fileItemName: { flex: 1, marginLeft: 10, fontSize: 13, color: '#4E342E' },
  btnSimpan: { backgroundColor: '#FF8C00', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 5 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#FFF', borderRadius: 15, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#4E342E', textAlign: 'center' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalItemText: { fontSize: 15, color: '#4E342E', textAlign: 'center' }
});