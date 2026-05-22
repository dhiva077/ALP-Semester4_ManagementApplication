import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useInputFileViewModel from '../../src/viewmodels/useInputFileViewModel';
import { fetchEvents } from '../../src/services/eventService';
import { uploadEventPdf } from '../../src/services/fileApi';

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEARS = ["2024", "2025", "2026", "2027"];

export default function InputFile() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const eventName = typeof params.eventName === 'string' ? params.eventName : null;
  const eventDate = typeof params.eventDate === 'string' ? params.eventDate : null;
  const fromChecklist = !!params.source;

  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [monthModal, setMonthModal] = useState(false);
  const [yearModal, setYearModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    onClose?: () => void;
  }>({ visible: false, type: 'success', title: '', message: '' });

  const { selectedFiles, handlePickFile, removeFile, removeFileByUri, clearAllFiles } = useInputFileViewModel();

  const normalizeName = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string, onClose?: () => void) => {
    setAlertConfig({ visible: true, type, title, message, onClose });
  };

  const mapEvent = (event: any) => {
    const start = event?.start_time || '';
    const dateOnly = start.includes('T') ? start.split('T')[0] : start.split(' ')[0];
    return {
      id: event.id,
      name: event.name,
      date: dateOnly,
      location: event.location,
      pic: event?.user?.name ?? 'PIC',
      start_time: event.start_time,
      end_time: event.end_time,
    };
  };

  // MEKANISME RESET UTAMA:
  // Hanya mendeteksi jika parameter rute berubah kosong / null (user masuk dari tab Navbar utama)
  useEffect(() => {
    if (!eventName) {
      setIsExpanded(false);
      setSelectedEvent(null);
      setSelectedMonth(new Date().getMonth());
      setSelectedYear(new Date().getFullYear().toString());
      setMonthModal(false);
      setYearModal(false);
      setAlertConfig({ visible: false, type: 'success', title: '', message: '' });
      
      if (selectedFiles && selectedFiles.length > 0) {
        clearAllFiles();
      }
    }
  }, [eventName]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        const mapped = data.map(mapEvent);
        setEvents(mapped);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Gagal mengambil data event.';
        showAlert('error', 'Error', msg);
      }
    };

    loadEvents();
  }, []);

  // Memasang data event otomatis jika dilempar melalui parameter halaman (dari checklist)
  useEffect(() => {
    if (eventName) {
      let found = null;
      const eventIdParam = params.eventId ? Number(params.eventId) : undefined;

      if (eventIdParam) {
        found = events.find(e => Number(e.id) === eventIdParam) || null;
      }

      if (!found) {
        found = events.find(e => normalizeName(e.name) === normalizeName(eventName)) || null;
      }

      if (!found && eventDate) {
        found = events.find(e => e.date === eventDate) || null;
      }

      if (!found && eventName !== "Detail Event") {
        found = events.find(e =>
          normalizeName(e.name).includes(normalizeName(eventName)) ||
          normalizeName(eventName).includes(normalizeName(e.name))
        ) || null;
      }

      if (found) {
        setSelectedEvent(found);
        const d = new Date(found.date);
        if (!isNaN(d.getTime())) {
          setSelectedMonth(d.getMonth());
          setSelectedYear(d.getFullYear().toString());
        }
      } else {
        const safeLocation = params.location && params.location !== 'Lokasi tidak ditemukan' ? params.location : 'Dian Auditorium';
        const safePic = params.pic && params.pic !== 'Petugas' ? params.pic : 'Fathir';

        setSelectedEvent({
          id: eventIdParam,
          name: eventName === "Detail Event" ? "Event Pilihan" : eventName,
          date: eventDate || '2026-05-20',
          location: safeLocation,
          pic: safePic,
        });

        if (eventDate) {
          const d = new Date(eventDate);
          if (!isNaN(d.getTime())) {
            setSelectedMonth(d.getMonth());
            setSelectedYear(d.getFullYear().toString());
          }
        }
      }
    }
  }, [eventName, eventDate, events, params.location, params.pic, params.eventId]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const dateObj = new Date(event.date);
      return dateObj.getMonth() === selectedMonth && dateObj.getFullYear().toString() === selectedYear;
    });
  }, [events, selectedMonth, selectedYear]);

  const handleBackNavigation = () => {
    if (fromChecklist) {
      router.replace({
        pathname: '/checklist',
        params: {
          eventName: eventName,
          eventDate: eventDate,
          location: params.location,
          pic: params.pic,
          eventId: params.eventId,
        }
      });
    } else {
      router.replace('/dashboard');
    }
  };

  const onPickFilePress = async () => {
    if (!selectedEvent) {
      showAlert('warning', 'Pilih Event', 'Silakan pilih nama event terlebih dahulu.');
      return;
    }
    
    // Membuka file picker lokal perangkat (Data Event dijamin tetap melekat dan aman)
    await handlePickFile();
  };

  const handleFinalUpload = async () => {
    if (selectedFiles.length === 0) {
      showAlert('warning', 'Berkas Kosong', 'Pilih file terlebih dahulu.');
      return;
    }

    if (!selectedEvent?.id) {
      showAlert('error', 'Event Tidak Valid', 'Event belum memiliki ID dari server.');
      return;
    }

    try {
      setIsUploading(true);

      for (const file of selectedFiles) {
        try {
          await uploadEventPdf(selectedEvent.id, file.uri, file.name);
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Gagal upload berkas.';
          showAlert('error', 'Gagal', `${file.name}: ${msg}`);
          return;
        }
      }

      clearAllFiles();
      showAlert('success', 'Berhasil', 'Berkas berhasil diunggah!', () => handleBackNavigation());
    } finally {
      setIsUploading(false);
    }
  };

  const renderPickerModal = (visible: boolean, data: string[], onSelect: (val: any, index?: number) => void, onClose: () => void, title: string) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerContent}>
          <View style={styles.pickerHeader}>
             <Text style={styles.modalTitle}>{title}</Text>
             <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#4E342E" /></TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => index.toString()}
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
      <Modal visible={alertConfig.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.alertCard}>
            <Ionicons 
              name={alertConfig.type === 'success' ? "checkmark-circle" : alertConfig.type === 'error' ? "close-circle" : "warning"} 
              size={60} 
              color={alertConfig.type === 'success' ? "#606C38" : alertConfig.type === 'error' ? "#FF383C" : "#EA9B03"} 
            />
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity 
              style={[styles.alertButton, { backgroundColor: alertConfig.type === 'success' ? '#606C38' : alertConfig.type === 'error' ? '#FF383C' : '#EA9B03' }]}
              onPress={() => {
                setAlertConfig(prev => ({ ...prev, visible: false }));
                if (alertConfig.onClose) alertConfig.onClose();
              }}
            >
              <Text style={styles.alertButtonText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Input File Event</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {!eventName && (
          <>
            <Text style={styles.sectionLabel}>Periode Event</Text>
            <View style={styles.compactFilterRow}>
              <TouchableOpacity style={styles.miniSelector} onPress={() => setMonthModal(true)}>
                <Ionicons name="calendar-outline" size={18} color="#FF8F29" />
                <Text style={styles.miniSelectorText}>{MONTHS[selectedMonth]}</Text>
                <Ionicons name="chevron-down" size={14} color="#8D6E63" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniSelector} onPress={() => setYearModal(true)}>
                <Ionicons name="time-outline" size={18} color="#FF8F29" />
                <Text style={styles.miniSelectorText}>{selectedYear}</Text>
                <Ionicons name="chevron-down" size={14} color="#8D6E63" />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={[styles.section, { zIndex: 100 }]}>
          <Text style={styles.sectionLabel}>{eventName ? "Event Terpilih" : "Daftar Event"}</Text>
          <TouchableOpacity 
            activeOpacity={0.8}
            disabled={!!eventName}
            style={[styles.selector, isExpanded && styles.selectorActive, !!eventName && styles.selectorDisabled]} 
            onPress={() => setIsExpanded(!isExpanded)}
          >
            <Text numberOfLines={1} style={[styles.selectorText, selectedEvent && { color: '#5C2C00', fontWeight: 'bold' }]}>
              {selectedEvent ? selectedEvent.name : "Pilih Nama Event"}
            </Text>
            {!eventName && <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#8D6E63" />}
          </TouchableOpacity>

          {isExpanded && !eventName && (
            <View style={styles.dropdownContainer}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled={true}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.eventItem} onPress={() => { setSelectedEvent(item); setIsExpanded(false); }}>
                      <View style={styles.iconCircle}><Ionicons name="calendar" size={16} color="#FF8F29" /></View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={styles.eventItemName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.eventItemDate}>{item.date} • {item.location}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ padding: 15, textAlign: 'center', color: '#888' }}>Tidak ada event di periode ini</Text>
                )}
              </ScrollView>
            </View>
          )}
        </View>

          {selectedEvent && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}><MaterialCommunityIcons name="account-tie" size={18} color="#8D6E63" /><Text style={styles.infoValue}>PIC: {selectedEvent.pic}</Text></View>
            <View style={styles.infoRow}><Ionicons name="location-outline" size={18} color="#8D6E63" /><Text style={styles.infoValue}>{selectedEvent.location}</Text></View>
            <View style={styles.infoRow}><Ionicons name="calendar-clear-outline" size={18} color="#8D6E63" /><Text style={styles.infoValue}>{selectedEvent.date}</Text></View>
          </View>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionLabel}>Upload Berkas</Text>
          <TouchableOpacity style={[styles.uploadBox, selectedFiles.length > 0 && styles.uploadBoxActive]} onPress={onPickFilePress}>
            <MaterialCommunityIcons name={selectedFiles.length > 0 ? "file-plus" : "cloud-upload"} size={40} color={selectedFiles.length > 0 ? "#2E7D32" : "#FF8F29"} />
            <Text style={styles.uploadText}>{selectedFiles.length > 0 ? "Tambah Berkas" : "Pilih File Dokumen"}</Text>
          </TouchableOpacity>

          {selectedFiles.map((file, index) => (
            <View key={index} style={styles.fileItemCard}>
              <Ionicons name="document-text" size={24} color="#FF8F29" />
              <Text style={styles.fileItemName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => removeFile(index)}>
                <Ionicons name="close-circle" size={22} color="#FF383C" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.btnSimpan, (selectedFiles.length === 0 || !selectedEvent || isUploading) && { opacity: 0.5 }]}
          onPress={handleFinalUpload}
          disabled={isUploading}
        >
          <Text style={styles.btnText}>Upload & Auto Mapping</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderPickerModal(monthModal, MONTHS, (val, idx) => { setSelectedMonth(idx!); setMonthModal(false); }, () => setMonthModal(false), "Pilih Bulan")}
      {renderPickerModal(yearModal, YEARS, (val) => { setSelectedYear(val); setYearModal(false); }, () => setYearModal(false), "Pilih Tahun")}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
  },

  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF8F29',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E342E',
  },

  section: {
    marginTop: 5,
    position: 'relative',
  },

  sectionLabel: {
    marginTop: 15,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5C2C00',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  compactFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  miniSelector: {
    flex: 1,
    height: 45,
    marginHorizontal: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  miniSelectorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#4E342E',
  },

  selector: {
    height: 50,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },

  selectorActive: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  selectorDisabled: {
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#DDD',
  },

  selectorText: {
    flex: 1,
    fontSize: 14,
    color: '#8D6E63',
  },

  dropdownContainer: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    elevation: 5,
  },

  dropdownScroll: {
    maxHeight: 180,
  },

  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFDF0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  eventItemDate: {
    fontSize: 11,
    color: '#5C2C00',
  },

  infoCard: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderLeftWidth: 4,
    borderLeftColor: '#FF8F29',
    elevation: 2,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  infoValue: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#5C2C00',
  },

  uploadBox: {
    height: 140,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#5C2C00',
    justifyContent: 'center',
    alignItems: 'center',
  },

  uploadBoxActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F1F8E9',
  },

  uploadText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5C2C00',
  },

  fileItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },

  fileItemName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#5C2C00',
  },

  btnSimpan: {
    backgroundColor: '#FF8F29',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },

  btnText: {
    color: '#FFFDF0',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertCard: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
  },

  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C2C00',
    marginTop: 15,
    marginBottom: 10,
  },

  alertMessage: {
    fontSize: 14,
    color: '#5C2C00',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },

  alertButton: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  alertButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  pickerContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },

  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  modalItemText: {
    fontSize: 16,
    color: '#5C2C00',
    textAlign: 'center',
  },
});