import { Component, type ErrorInfo, type ReactNode } from "react";
import { Platform, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class WebErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[WebErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View
          style={{
            flex: 1,
            minHeight: Platform.OS === "web" ? "100vh" : undefined,
            padding: 24,
            justifyContent: "center",
            backgroundColor: "#FAF7F4",
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 12 }}>
            Une erreur est survenue
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: "#5C4D42" }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}
