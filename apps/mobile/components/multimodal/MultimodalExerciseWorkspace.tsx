import { useCallback, useState } from "react";
import { Text, View } from "react-native";
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

const STEP_HEADERS: Record<
  Exclude<MultimodalWorkflowStep, "analyzing">,
  { label: string; title: string; accent?: string }
> = {
  media: {
    label: "Étape 1",
    title: "Votre ",
    accent: "expression",
  },
  questionnaire: {
    label: "Étape 2",
    title: "Ancrer votre ",
    accent: "ressenti",
  },
  upload: {
    label: "Étape 3",
    title: "Partager votre ",
    accent: "création",
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
        setFileError("Format de fichier non compatible avec ce type d'expression.");
        return;
      }
      setFileError(null);
      setFile(selected);
    },
    [mediaType]
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
        err instanceof Error
          ? err.message
          : "L'analyse n'a pas pu aboutir. Réessayez dans un instant."
      );
    }
  }, [
    mediaType,
    file,
    answers,
    exerciseData,
    onAnalyze,
    onAnalysisComplete,
  ]);

  const canContinue =
    (step === "media" && mediaType !== null) ||
    (step === "questionnaire" && answersComplete(answers)) ||
    (step === "upload" && file !== null);

  return (
    <View
      accessibilityLabel="Espace d'expression multimodale"
      className={className}
    >
      <StepIndicator current={step} />

      {step !== "analyzing" ? (
        <SectionHeader
          label={STEP_HEADERS[step].label}
          title={STEP_HEADERS[step].title}
          accent={STEP_HEADERS[step].accent}
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
              label="Lancer l'analyse bienveillante"
              onPress={() => void handleSubmit()}
              disabled={!file}
            />
          ) : (
            <PrimaryButton
              label="Continuer"
              onPress={goNext}
              disabled={!canContinue}
              showArrow
            />
          )}

          {step !== "media" ? (
            <PrimaryButton
              label="Retour"
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
              Consigne : {exerciseData.exercise}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
