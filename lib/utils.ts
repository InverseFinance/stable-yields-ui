import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type GTagEvent = {
  action: string;
  params?: {
      category: string;
      label: string;
      value: number;
  }
};

const isProd = () => {
  return ["https://www.stableyields.info", "https://stableyields.info"].includes(location.origin);
}

export const gaEvent = ({ action, params }: GTagEvent) => {
  if(!isProd()){
      return
  }
  window.gtag('event', action, params)
}