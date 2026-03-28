import { ShotType, Theme } from "./types";

export const SHOT_TYPES: { label: string; value: ShotType }[] = [
  { label: "3-Pointers", value: "3pt" },
  { label: "Mid-Range", value: "midrange" },
  { label: "Free Throws", value: "freethrow" },
  { label: "Layups", value: "layup" },
  { label: "Floaters", value: "floater" },
];

export const THEMES: Theme[] = [
  { 
    id: "default", 
    name: "Classic Dark", 
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1920&auto=format&fit=crop",
    color: "bg-zinc-950"
  },
  { 
    id: "lebron", 
    name: "LeBron James", 
    image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=1920&auto=format&fit=crop",
    color: "bg-purple-950"
  },
  { 
    id: "curry", 
    name: "Stephen Curry", 
    image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=1920&auto=format&fit=crop",
    color: "bg-blue-950"
  },
  { 
    id: "kobe", 
    name: "Kobe Bryant", 
    image: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?q=80&w=1920&auto=format&fit=crop",
    color: "bg-yellow-950"
  },
  { 
    id: "jordan", 
    name: "Michael Jordan", 
    image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=1920&auto=format&fit=crop",
    color: "bg-red-950"
  },
  { 
    id: "street", 
    name: "Street Court", 
    image: "https://images.unsplash.com/photo-1505666287802-931dc83948e9?q=80&w=1920&auto=format&fit=crop",
    color: "bg-orange-950"
  }
];

export const STORAGE_KEY = "hoopsense_history";
export const THEME_KEY = "hoopsense_theme";
