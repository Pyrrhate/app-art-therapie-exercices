/// <reference types="react-native-css-interop/types" />

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
}

export {};
