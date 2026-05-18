import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { fetchEvents } from '../../src/services/eventService';
import { fetchFiles, buildFileUrl } from '../../src/services/fileApi';

const BASE_CHECKLIST = [
  { id: 1, title: "From Checklist Sebelum Acara", docKey: 'form_checklist_sebelum_acara', statusKey: 'statusFormChecklistSebelumAcara' },
  { id: 2, title: "Surat Perjanjian Kerjasama", docKey: 'surat_perjanjian_kerjasama', statusKey: 'statusSuratPerjanjianKerjasama' },
  { id: 3, title: "Invoice", docKey: 'invoice', statusKey: 'statusInvoice' },
  { id: 4, title: "Lembar Disposisi", docKey: 'lembar_disposisi', statusKey: 'statusLembarDisposisi' },
  { id: 5, title: "Surat Izin Loading", docKey: 'surat_izin_loading', statusKey: 'statusSuratIzinLoading' },
  { id: 6, title: "From Checklist Setelah Acara", docKey: 'form_checklist_setelah_acara', statusKey: 'statusFormChecklistSetelahAcara' },
];

export default function Checklist() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { eventName, eventDate, source, eventId } = params;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [fileRecord, setFileRecord] = useState<any>(null);

  const currentEventName = typeof eventName === 'string' ? eventName : "Detail Event";
  const currentEventDate = typeof eventDate === 'string' ? eventDate : "";
  const sourceFrom = typeof source === 'string' ? source : 'dashboard';
  const getEventDate = (event: any) => {
    const start = event?.start_time || '';
    return start.includes('T') ? start.split('T')[0] : start.split(' ')[0];
  };

  const loadData = async () => {
    try {
      const [events, files] = await Promise.all([fetchEvents(), fetchFiles()]);

      let matched = null;
      if (eventId) {
        matched = events.find((e: any) => String(e.id) === String(eventId));
      }

      if (!matched && eventName) {
        matched = events.find((e: any) => e.name === eventName);
      }

      if (!matched && eventDate) {
        matched = events.find((e: any) => getEventDate(e) === eventDate);
      }

      if (!matched && eventName) {
        const fileMatched = files.find((file: any) => file?.event?.name === eventName);
        matched = fileMatched?.event || null;
      }

      setCurrentEvent(matched || null);

      const eventIdValue = matched?.id || eventId;
      let relatedFile = null;
      if (eventIdValue) {
        relatedFile = files.find((file: any) => String(file.event_id) === String(eventIdValue));
      }
      if (!relatedFile && eventName) {
        relatedFile = files.find((file: any) => file?.event?.name === eventName);
      }
      if (!relatedFile && eventDate) {
        relatedFile = files.find((file: any) => {
          const fileDate = getEventDate(file?.event || {});
          return fileDate === eventDate;
        });
      }

      setFileRecord(relatedFile || null);
    } catch (error) {
      console.error('Load checklist error:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [eventId, eventName, eventDate])
  );

  const filteredChecklist = BASE_CHECKLIST.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'S': return '#606C38';
      case 'R': return '#EA9B03';
      case 'B': return '#FF383C';
      default: return '#FF383C';
    }
  };

  const toSnake = (value: string) => value.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

  const getStatusCode = (statusKey: string, docKey: string) => {
    const resolvedStatus = fileRecord?.[statusKey] ?? fileRecord?.[toSnake(statusKey)];
    if (resolvedStatus?.code) return resolvedStatus.code;
    if (fileRecord?.[docKey]) return 'S';
    return 'B';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (sourceFrom === 'penyimpanan') router.push('/(tabs)/penyimpanan');
              else if (sourceFrom === 'notifikasi') {
                router.push({ pathname: '/(tabs)/notifikasi-detail', params: { eventName: currentEventName, eventDate: currentEventDate } });
              } else router.push('/(tabs)/dashboard');
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>{currentEventName}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#5C2C00" />
            <TextInput
              placeholder="Search Dokumen"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/(tabs)/edit-event', params: { eventName: currentEventName, eventDate: currentEventDate, source: 'checklist' } })}>
            <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.orangeBanner}>
          <Text style={styles.bannerText}>{currentEventName}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {filteredChecklist.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-search-outline" size={80} color="#D2B48C" />
            <Text style={styles.emptyText}>
              {'"'}<Text style={{ fontWeight: 'bold' }}>{searchQuery}</Text>{'"'} tidak ditemukan
            </Text>
          </View>
        ) : (
          filteredChecklist.map((item) => {
            const statusCode = getStatusCode(item.statusKey, item.docKey);
            const filePath = fileRecord?.[item.docKey] || null;
            const fileUrlFromApi = fileRecord?.[`${item.docKey}_url`] || null;
            const hasFile = !!filePath && statusCode !== 'B';
            const path = hasFile ? '/(tabs)/file-detail' : '/(tabs)/input-file';
            const eventNameValue = currentEvent?.name || currentEventName;
            const eventDateValue = currentEvent ? getEventDate(currentEvent) : currentEventDate;
            const eventIdValue = currentEvent?.id || eventId;

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.checklistCard}
                onPress={() => {
                  router.push({
                    pathname: path,
                    params: {
                      title: item.title,
                      eventName: eventNameValue,
                      eventDate: eventDateValue,
                      eventId: eventIdValue,
                      checklistId: item.id,
                      docKey: item.docKey,
                      filePath: filePath || undefined,
                      fileUrl: buildFileUrl(fileUrlFromApi || filePath) || undefined,
                      source: sourceFrom,
                      location: currentEvent?.location || params.location,
                      pic: currentEvent?.user?.name || params.pic,
                    }
                  });
                }}
              >
                <Text style={styles.checklistTitle}>{item.title}</Text>
                <View style={[styles.statusCircle, { backgroundColor: getStatusColor(statusCode) }]} />
              </TouchableOpacity>
            );
          })
        )}

        {filteredChecklist.length > 0 && (
          <View style={styles.legendContainer}>
            <Text style={styles.legendHeader}>Keterangan:</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}><View style={[styles.miniDot, { backgroundColor: '#FF383C' }]} /><Text style={styles.legendText}>Belum ada file</Text></View>
              <View style={styles.legendItem}><View style={[styles.miniDot, { backgroundColor: '#EA9B03' }]} /><Text style={styles.legendText}>Revisi</Text></View>
              <View style={styles.legendItem}><View style={[styles.miniDot, { backgroundColor: '#606C38' }]} /><Text style={styles.legendText}>Selesai</Text></View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2DB',
  },

  fixedHeader: {
    paddingHorizontal: 25,
    backgroundColor: '#FEF2DB',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 35,
  },

  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8F29',
    elevation: 4,
  },

  titleContainer: {
    maxWidth: '70%',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5C2C00',
    textAlign: 'center',
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#fff',
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#5C2C00',
  },

  editButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5C2C00',
    elevation: 3,
  },

  orangeBanner: {
    paddingVertical: 16,
    marginBottom: 10,
    borderRadius: 15,
    backgroundColor: '#FF8F29',
    elevation: 3,
  },

  bannerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFDF0',
    textAlign: 'center',
  },

  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },

  checklistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFDF0',
    elevation: 2,
  },

  checklistTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  statusCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  legendContainer: {
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 3,
  },

  legendHeader: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#5C2C00',
  },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  miniDot: {
    width: 13,
    height: 13,
    borderRadius: 10,
  },

  legendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C2C00',
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },

  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#5C2C00',
    textAlign: 'center',
  },
});