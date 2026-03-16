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
  image?: string;
}

import { ReactNode } from 'react';

export interface WhyChooseItem {
  icon: string | ReactNode;
  title: string;
  description: string;
}

