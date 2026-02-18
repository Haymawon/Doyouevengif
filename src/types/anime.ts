export interface JikanAnime {
  mal_id: number;
  title: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  synopsis: string;
  episodes: number | null;
  score: number | null;
  year: number | null;
  status: string;
  type?: string;
  duration?: string;
  rating?: string;
}

export interface AniListManga {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string;
  };
  coverImage: {
    large: string;
    medium: string;
  };
  description: string | null;
  chapters: number | null;
  volumes: number | null;
  averageScore: number | null;
  status: string;
  startDate: {
    year: number | null;
  };
}
