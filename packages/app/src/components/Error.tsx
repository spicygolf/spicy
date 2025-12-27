import { useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Button, Text } from "@/ui";

interface ErrorDisplayProps {
  /** The error object or message string */
  error: Error | string;
  /** Custom title (defaults to golf-themed message) */
  title?: string;
  /** Show technical details toggle (for dev/admin) */
  showDetailsToggle?: boolean;
  /** Callback for retry button */
  onRetry?: () => void;
  /** Callback for dismiss/close */
  onDismiss?: () => void;
  /** Compact mode for inline errors */
  compact?: boolean;
}

/**
 * Error display component with user-friendly message and optional technical details.
 * Follows local-first principles - display errors immediately, log to CoFeed in background.
 */
export function ErrorDisplay({
  error,
  title = "Sorry, the app just made a double bogey.",
  showDetailsToggle = __DEV__,
  onRetry,
  onDismiss,
  compact = false,
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);

  const errorMessage =
    typeof error === "string" ? error : error.message || "An error occurred";
  const errorStack = typeof error === "object" ? error.stack : undefined;
  const errorName = typeof error === "object" ? error.name : "Error";

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactMessage}>{errorMessage}</Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} style={styles.compactRetry}>
            <Text style={styles.compactRetryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{errorMessage}</Text>

      {showDetailsToggle && (
        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          style={styles.detailsToggle}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? "Hide Details" : "Show Details"}
          </Text>
        </TouchableOpacity>
      )}

      {showDetails && (
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailsLabel}>Type:</Text>
          <Text style={styles.detailsText}>{errorName}</Text>

          {errorStack && (
            <>
              <Text style={styles.detailsLabel}>Stack Trace:</Text>
              <Text style={styles.stackText}>{errorStack}</Text>
            </>
          )}
        </ScrollView>
      )}

      <View style={styles.buttonRow}>
        {onRetry && <Button label="Try Again" onPress={onRetry} />}
        {onDismiss && <Button label="Dismiss" onPress={onDismiss} />}
      </View>
    </View>
  );
}

/**
 * Inline error message for form fields or small areas
 */
export function InlineError({ message }: { message: string }) {
  return (
    <View style={styles.inlineContainer}>
      <Text style={styles.inlineText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    padding: theme.gap(2),
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    margin: theme.gap(1),
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.gap(1),
  },
  message: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },
  detailsToggle: {
    alignSelf: "center",
    padding: theme.gap(1),
    marginBottom: theme.gap(1),
  },
  detailsToggleText: {
    fontSize: 12,
    color: theme.colors.action,
    textDecorationLine: "underline",
  },
  detailsContainer: {
    maxHeight: 200,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    padding: theme.gap(1),
    marginBottom: theme.gap(2),
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: theme.colors.secondary,
    marginTop: theme.gap(1),
  },
  detailsText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontFamily: "monospace",
  },
  stackText: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.gap(1),
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.gap(1),
    backgroundColor: theme.colors.background,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  compactMessage: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.error,
  },
  compactRetry: {
    padding: theme.gap(0.5),
  },
  compactRetryText: {
    fontSize: 12,
    color: theme.colors.action,
    fontWeight: "bold",
  },
  // Inline styles
  inlineContainer: {
    paddingVertical: theme.gap(0.5),
  },
  inlineText: {
    fontSize: 12,
    color: theme.colors.error,
  },
}));
