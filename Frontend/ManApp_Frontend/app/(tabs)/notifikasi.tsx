import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { fetchEvents } from "../../src/services/eventService";

interface NotificationItem {
  id: number;
  eventName: string;
  eventDate: string;
  incompleteCount: number;
  desc: string;
}

export default function Notifikasi() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const savedUserStr = await AsyncStorage.getItem("user");
      if (!savedUserStr) return;
      const currentUser = JSON.parse(savedUserStr);

      const allEvents = await fetchEvents();

      const list: NotificationItem[] = [];

      allEvents.forEach((event: any) => {
        // filter by user
        if (event.user_id !== currentUser.id) return;

        let incompleteCount = 0;

        // Count uncompleted files based on status_id (assuming 3 is 'Selesai' and 1 is 'Belum Selesai', etc.)
        // But since we just need the count, let's assume `event.files` might be an array or object containing file statuses
        if (event.files && event.files.length > 0) {
          const files = event.files[0];
          const statuses = [
            files.status_form_checklist_sebelum_acara_id,
            files.status_surat_perjanjian_kerjasama_id,
            files.status_invoice_id,
            files.status_lembar_disposisi_id,
            files.status_surat_izin_loading_id,
            files.status_form_checklist_setelah_acara_id,
          ];

          // Count statuses that are not 'Selesai' (usually ID 3 is 'Selesai', adjust if your DB uses different IDs)
          // Let's assume ID 3 means Done. Any other or null means not done.
          incompleteCount = statuses.filter((status) => status !== 3).length;
        } else {
          // no files record found, so all 6 are missing
          incompleteCount = 6;
        }

        if (incompleteCount > 0) {
          list.push({
            id: event.id,
            eventName: event.name,
            eventDate: event.start_time,
            incompleteCount,
            desc: `Peringatan! Ayo buruan dicek, masih ada ${incompleteCount} file yang masih perlu diperhatikan`,
          });
        }
      });

      // Sort by start_time
      setNotifications(
        list.sort(
          (a, b) =>
            new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
        ),
      );
    } catch (error) {
      console.error("Gagal memuat notifikasi:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, []),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(tabs)/dashboard")}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifikasi</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((item, index) => (
            <TouchableOpacity
              key={`${item.eventName}-${index}`}
              style={styles.notifCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/notifikasi-detail",
                  params: {
                    eventName: item.eventName,
                    eventDate: item.eventDate,
                  },
                })
              }
            >
              <View style={styles.iconContainer}>
                <Ionicons name="folder" size={38} color="#5D4037" />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.notifTitle}>{item.eventName}</Text>
                <Text style={styles.notifDesc} numberOfLines={2}>
                  {item.desc}
                </Text>
              </View>

              <View style={styles.orangeBadge}>
                <Text style={styles.badgeText}>{item.incompleteCount}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color="#D7CCC8"
            />
            <Text style={styles.emptyText}>Semua file sudah lengkap!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2E3C9",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },

  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#FF8C2B",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5D4037",
  },

  spacer: {
    width: 45,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: "#FFFBF2",
    elevation: 3,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  iconContainer: {
    marginRight: 15,
  },

  textContainer: {
    flex: 1,
    marginRight: 10,
  },

  notifTitle: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: "bold",
    color: "#5D4037",
  },

  notifDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: "#7A5C46",
  },

  orangeBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF8C2B",
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },

  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
    opacity: 0.5,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#5D4037",
  },
});
