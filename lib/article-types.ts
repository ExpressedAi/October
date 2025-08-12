export interface Article {
  id: number;
  title: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImagePromptsResponse {
  prompts: string[];
}