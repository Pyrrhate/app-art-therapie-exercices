import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AnalysisLoadingState } from "@/components/multimodal/AnalysisLoadingState";
import { ContextQuestionnaireStep } from "@/components/multimodal/ContextQuestionnaireStep";
import { MediaSelectorStep } from "@/components/multimodal/MediaSelectorStep";
import { MultimodalDropzone } from "@/components/multimodal/MultimodalDropzone";
import { StepIndicator } from "@/components/multimodal/StepIndicator";
import { PrimaryButton } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { generateMultimodalPrompt } from "@/lib/multimodal/generateMultimodalPrompt";
import { isFileAllowedForMedia } from "@/lib/multimodal/mediaConfig";
import type {
  ExpressionMediaType,
  MultimodalAnalysisRequest,
  MultimodalExerciseContext,
  MultimodalMediaFile,
  MultimodalUserAnswers,
  MultimodalWorkflowStep,
} from "@/lib/multimodal/types";
import { EMPTY_USER_ANSWERS } from "@/lib/multimodal/types";
import { textMuted } from "@/lib/themeClasses";
import { useIsDark } from "@/lib/themeStore";

const STEP_HEADER_KEYS: Record<
  Exclude<MultimodalWorkflowStep, "analyzing">,
  { label: string; title: string; accent: string }
> = {
  media: {
    label: "multimodal.step1Label",
    title: "multimodal.step1Title",
    accent: "multimodal.step1Accent",
  },
  questionnaire: {
    label: "multimodal.step2Label",
    title: "multimodal.step2Title",
    accent: "multimodal.step2Accent",
  },
  upload: {
    label: "multimodal.step3Label",
    title: "multimodal.step3Title",
    accent: "multimodal.step3Accent",
  },
};

function answersComplete(answers: MultimodalUserAnswers): boolean {
  return (
    answers.emotionalWord.trim().length >= 2 &&
    answers.anchorMoment.trim().length >= 2 &&
    answers.bodilyState.trim().length >= 2
  );
}

export interface MultimodalExerciseWorkspaceProps {
  exerciseData: MultimodalExerciseContext;
  /**
   * Appelé avec le prompt croisé et le contexte complet.
   * Retourne la réflexion générée (ou délègue à l'API).
   */
  onAnalyze: (request: MultimodalAnalysisRequest) => Promise<void>;
  /** Appelé après analyse réussie. */
  onAnalysisComplete?: () => void;
  className?: string;
}

/**
 * Workspace principal — workflow multimodal en 4 étapes :
 * sélection du média → questionnaire → dépôt → analyse IA croisée.
 */
export function MultimodalExerciseWorkspace({
  exerciseData,
  onAnalyze,
  onAnalysisComplete,
  className = "",
}: MultimodalExerciseWorkspaceProps) {
  const isDark = useIsDark();
  const { t } = useTranslation("ritual");
  const [step, setStep] = useState<MultimodalWorkflowStep>("media");
  const [mediaType, setMediaType] = useState<ExpressionMediaType | null>(null);
  const [answers, setAnswers] = useState<MultimodalUserAnswers>(EMPTY_USER_ANSWERS);
  const [file, setFile] = useState<MultimodalMediaFile | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleMediaSelect = useCallback((type: ExpressionMediaType) => {
    setMediaType(type);
    setFile(null);
    setFileError(null);
  }, []);

  const handleFileSelected = useCallback(
    (selected: MultimodalMediaFile) => {
      if (!mediaType) return;
      if (!isFileAllowedForMedia(selected.name, selected.mimeType, mediaType)) {
        setFileError(t("multimodal.fileNotSupported"));
        return;
      }
      setFileError(null);
      setFile(selected);
    },
    [mediaType, t]
  );

  const goNext = useCallback(() => {
    setSubmitError(null);
    if (step === "media" && mediaType) {
      setStep("questionnaire");
      return;
    }
    if (step === "questionnaire" && answersComplete(answers)) {
      setStep("upload");
      return;
    }
  }, [step, mediaType, answers]);

  const goBack = useCallback(() => {
    setSubmitError(null);
    if (step === "questionnaire") setStep("media");
    else if (step === "upload") setStep("questionnaire");
  }, [step]);

  const handleSubmit = useCallback(async () => {
    if (!mediaType || !file || !answersComplete(answers)) return;

    setSubmitError(null);
    setStep("analyzing");

    const prompt = generateMultimodalPrompt(exerciseData, answers, mediaType);
    const request: MultimodalAnalysisRequest = {
      mediaType,
      exercise: exerciseData,
      answers,
      file,
      prompt,
    };

    try {
      await onAnalyze(request);
      onAnalysisComplete?.();
    } catch (err) {
      setStep("upload");
      setSubmitError(
        err instanceof Error ? err.message : t("multimodal.analysisFailed")
      );
    }
  }, [
    mediaType,
    file,
    answers,
    exerciseData,
    onAnalyze,
    onAnalysisComplete,
    t,
  ]);

  const canContinue =
    (step === "media" && mediaType !== null) ||
    (step === "questionnaire" && answersComplete(answers)) ||
    (step === "upload" && file !== null);

  return (
    <View
      accessibilityLabel={t("multimodal.workspaceA11y")}
      className={className}
    >
      <StepIndicator current={step} />

      {step !== "analyzing" ? (
        <SectionHeader
          label={t(STEP_HEADER_KEYS[step].label)}
          title={t(STEP_HEADER_KEYS[step].title)}
          accent={t(STEP_HEADER_KEYS[step].accent)}
          className="mb-6"
        />
      ) : null}

      {step === "media" ? (
        <MediaSelectorStep selected={mediaType} onSelect={handleMediaSelect} />
      ) : null}

      {step === "questionnaire" ? (
        <ContextQuestionnaireStep answers={answers} onChange={setAnswers} />
      ) : null}

      {step === "upload" && mediaType ? (
        <MultimodalDropzone
          mediaType={mediaType}
          file={file}
          error={fileError ?? submitError}
          onFileSelected={handleFileSelected}
          onClear={() => {
            setFile(null);
            setFileError(null);
          }}
        />
      ) : null}

      {step === "analyzing" ? <AnalysisLoadingState /> : null}

      {step !== "analyzing" ? (
        <View className="mt-10 gap-3">
          {step === "upload" ? (
            <PrimaryButton
              label={t("multimodal.analyzeCta")}
              onPress={() => void handleSubmit()}
              disabled={!file}
            />
          ) : (
            <PrimaryButton
              label={t("multimodal.continue")}
              onPress={goNext}
              disabled={!canContinue}
              showArrow
            />
          )}

          {step !== "media" ? (
            <PrimaryButton
              label={t("multimodal.back")}
              onPress={goBack}
              variant="ghost"
              align="stretch"
            />
          ) : null}

          {exerciseData.exercise ? (
            <Text
              className={`text-xs text-center mt-2 leading-5 px-2 ${textMuted(isDark)}`}
              numberOfLines={3}
            >
              {t("multimodal.briefPrefix", { exercise: exerciseData.exercise })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
