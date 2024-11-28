export const calculateTrend = (current: number, target: number) => {
  if (!current || !target) return null;
  
  const difference = current - target;
  const percentChange = (difference / target) * 100;
  
  return {
    value: difference,
    text: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% vs target`
  };
}; 