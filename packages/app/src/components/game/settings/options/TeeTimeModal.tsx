import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { formatDate, formatTime } from "spicylib/utils";
import { Button, ModalHeader, Text } from "@/ui";

interface TeeTimeModalProps {
  visible: boolean;
  currentDate: Date;
  isEvening: boolean;
  onSave: (date: Date) => void;
  onClose: () => void;
}

export function TeeTimeModal({
  visible,
  currentDate,
  isEvening,
  onSave,
  onClose,
}: TeeTimeModalProps) {
  const { theme } = useUnistyles();
  // Component unmounts when not visible (early return below),
  // so state is fresh from currentDate on each mount.
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function handleDateChange(_event: DateTimePickerEvent, date?: Date): void {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate((prev) => {
        const next = new Date(date);
        next.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
        return next;
      });
    }
  }

  function handleTimeChange(_event: DateTimePickerEvent, date?: Date): void {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedDate((prev) => {
        const next = new Date(prev);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        return next;
      });
    }
  }

  function handleSave(): void {
    onClose();
    onSave(selectedDate);
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <ModalHeader title="Tee Time" onClose={onClose} />

          {isEvening && (
            <View
              style={[
                styles.cautionBanner,
                { backgroundColor: `${theme.colors.warning}20` },
              ]}
            >
              <Text
                style={[styles.cautionText, { color: theme.colors.warning }]}
              >
                Game created in the evening. Tee time defaulted to tomorrow
                morning.
              </Text>
            </View>
          )}

          {Platform.OS === "ios" ? (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={handleDateChange}
              />
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
              />
            </View>
          ) : (
            <View style={styles.pickerContainer}>
              <Pressable
                style={styles.androidPickerRow}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.androidPickerLabel}>Date</Text>
                <Text style={styles.androidPickerValue}>
                  {formatDate(selectedDate)}
                </Text>
              </Pressable>

              <Pressable
                style={styles.androidPickerRow}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.androidPickerLabel}>Time</Text>
                <Text style={styles.androidPickerValue}>
                  {formatTime(selectedDate)}
                </Text>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button label="Save" onPress={handleSave} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.gap(2),
    width: "100%",
    maxWidth: 400,
  },
  cautionBanner: {
    padding: theme.gap(1),
    borderRadius: 8,
    marginBottom: theme.gap(2),
  },
  cautionText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  pickerContainer: {
    gap: theme.gap(1),
  },
  androidPickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  androidPickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  androidPickerValue: {
    fontSize: 16,
    color: theme.colors.secondary,
  },
  buttonContainer: {
    marginTop: theme.gap(2),
  },
}));
