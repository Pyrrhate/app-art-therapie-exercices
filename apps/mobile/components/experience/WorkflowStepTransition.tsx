import type { ReactNode } from "react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface WorkflowStepTransitionProps {
  stepKey: string;
  children: ReactNode;
  className?: string;
}

/** Transition douce entre les étapes du parcours. */
export function WorkflowStepTransition({
  stepKey,
  children,
  className = "",
}: WorkflowStepTransitionProps) {
  return (
    <Animated.View
      key={stepKey}
      entering={FadeIn.duration(420)}
      exiting={FadeOut.duration(280)}
      className={className}
    >
      {children}
    </Animated.View>
  );
}
