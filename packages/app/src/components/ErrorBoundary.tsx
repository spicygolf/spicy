import React, { Component, type ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ErrorDisplay } from "@/components/Error";
import { reportError } from "@/utils/reportError";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch React errors in child components
 * Prevents the entire app from crashing when a component fails
 *
 * NOTE: This is a class component, which is an exception to the project's
 * "functional components only" rule. React Error Boundaries MUST be class
 * components as there is no functional equivalent (no hook exists for
 * componentDidCatch). This is the only acceptable use case for class components.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Report error to PostHog via console.error (autocaptured)
    reportError(error, {
      source: "ErrorBoundary",
      severity: "error",
      context: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <ErrorDisplay
            error={this.state.error || "An unexpected error occurred"}
            title="Oops! The app hit a rough patch."
            onRetry={this.handleRetry}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
    backgroundColor: theme.colors.background,
  },
}));
