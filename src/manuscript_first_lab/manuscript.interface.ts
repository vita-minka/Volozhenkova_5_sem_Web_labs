export type ManuscriptStatus = 'draft' | 'published' | 'deleted';

export interface Manuscript {
  id: number;
  title: string;
  description: string;
  century: number;
  sign: string;
  image: string;
  video: string;
  status: ManuscriptStatus;
  likes: number[];
}