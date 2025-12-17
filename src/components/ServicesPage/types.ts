export interface Service {
  id: number;
  title: string;
  icon: string;
  description: string;
  details: string[];
  technologies: string[];
  pricing: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

