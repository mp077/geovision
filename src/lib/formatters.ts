export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateShort(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getCategoryBadgeColor(category: string): { bg: string; text: string; border: string } {
  switch (category.toLowerCase()) {
    case 'igneous':
      return { bg: 'bg-[#FDF3F2]', text: 'text-[#9C382C]', border: 'border-[#F8D2CE]' };
    case 'sedimentary':
      return { bg: 'bg-[#FEF7EE]', text: 'text-[#9A5B13]', border: 'border-[#F9E2C6]' };
    case 'metamorphic':
      return { bg: 'bg-[#F2F4F8]', text: 'text-[#3E5677]', border: 'border-[#D1DCE9]' };
    case 'mineral':
      return { bg: 'bg-[#EBF3EE]', text: 'text-[#244B3B]', border: 'border-[#CCE2D5]' };
    case 'ore':
      return { bg: 'bg-[#F5F2EB]', text: 'text-[#6E5C3B]', border: 'border-[#DFD5C2]' };
    default:
      return { bg: 'bg-[#F4F3EF]', text: 'text-[#4A5568]', border: 'border-[#E2DFD7]' };
  }
}

export function getConfidenceBadgeColor(confidence: number): { bg: string; text: string; border: string } {
  if (confidence >= 0.9) {
    return { bg: 'bg-[#EBF3EE]', text: 'text-[#204936]', border: 'border-[#C8DFD1]' };
  }
  if (confidence >= 0.75) {
    return { bg: 'bg-[#FEF7EE]', text: 'text-[#8A500F]', border: 'border-[#F8DFC0]' };
  }
  return { bg: 'bg-[#FBF1F1]', text: 'text-[#A13028]', border: 'border-[#F4CBC9]' };
}
