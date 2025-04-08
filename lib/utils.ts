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


export const getMinPrecisionValue = (precision = 2) => {
  return 1 / Math.pow(10, precision);
}

export const getValueOrMinPrecisionValue = (value: number, precision = 2) => {
  const minPrecisionValue = getMinPrecisionValue(precision);
  const isLowerThanMinPrecision = Math.abs(value) > 0 && Math.abs(value) < minPrecisionValue
  return isLowerThanMinPrecision ? minPrecisionValue : value;
}
export const dollarify = (value: number, precision = 2, showPlusSign = false, showMinPrecision = false): string => {
  if (typeof value !== 'number' && value !== NaN) { return '$' }
  const signPrefix = value > 0 ? showPlusSign ? '+' : '' : value < 0 ? '-' : ''
  try {
      const minValue = getValueOrMinPrecisionValue(value, precision)
      const content = minValue !== Math.abs(value) && showMinPrecision ? `<$${minValue}` : `$${(Math.abs(value)?.toFixed(precision))}`
      return `${signPrefix}${content}`
  } catch (e) {
      console.log(value);
  }
  return '$';
}
export const shortenNumber = (value: number, precision = 2, isDollar = false, showMinPrecision = false) => {
  if (typeof value !== 'number' || isNaN(value)) { return `${isDollar ? '$' : ''}` + (0).toFixed(precision) }
  let suffix = ''
  const dividers: { [key: string]: number } = { 'k': 1000, 'M': 1000000, 'B': 1000000000, 'T': 1000000000000 };
  const absValue = Math.abs(value);
  if (absValue >= 1000000000000) { suffix = 'T' }
  else if (absValue >= 1000000000) { suffix = 'B' }
  else if (absValue >= 1000000) { suffix = 'M' }
  else if (absValue >= 1000) { suffix = 'k' }
  const divider: number = dividers[suffix] || 1
  const shortValue = value / divider;
  const numResult = isDollar ? dollarify(shortValue, precision, false, showMinPrecision) : shortValue.toFixed(precision)
  const minPrecisionValue = getMinPrecisionValue(precision)
  const minValue = getValueOrMinPrecisionValue(value, precision)
  const content = minValue !== Math.abs(value) && Math.abs(value) < minPrecisionValue && showMinPrecision && !isDollar ? `<${value < 0 ? '0' : minValue}` : numResult;
  return `${content}${suffix}`
}
export const removeTrailingZeros = (num: string) => {
  return num.replace(/(\.\d*?[1-9])0+([a-zA-Z])?$/, '$1$2').replace(/\.0+([a-zA-Z])?$/, '$1')
}
export const smartShortNumber = (value: number, precision = 2, isDollar = false, showMinPrecision = false) => {
  const num = shortenNumber(value, precision, isDollar, showMinPrecision);
  return removeTrailingZeros(num);
}