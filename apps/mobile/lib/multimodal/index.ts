export {
  generateMultimodalPrompt,
} from "@/lib/multimodal/generateMultimodalPrompt";
export {
  isFileAllowedForMedia,
  MEDIA_TYPE_CONFIG,
  MEDIA_TYPE_ORDER,
} from "@/lib/multimodal/mediaConfig";
export type {
  ExpressionMediaType,
  MultimodalAnalysisRequest,
  MultimodalExerciseContext,
  MultimodalMediaFile,
  MultimodalUserAnswers,
  MultimodalWorkflowStep,
} from "@/lib/multimodal/types";
export { EMPTY_USER_ANSWERS } from "@/lib/multimodal/types";
