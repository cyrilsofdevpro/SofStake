import { NormalizedToken } from './dexscreener';

export type RiskLabel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export type RugRisk = {
  riskScore: number;
  label: RiskLabel;
  warnings: string[];
};

export function evaluateRugRisk(token: Pick<NormalizedToken, 'liquidityUsd' | 'volume24h' | 'priceChange24h' | 'createdAt'>): RugRisk {
  const warnings: string[] = [];
  let score = 0;

  if (token.liquidityUsd <= 0) {
    score += 50;
    warnings.push('No liquidity data available.');
  } else if (token.liquidityUsd < 15000) {
    score += 40;
    warnings.push('Very low liquidity.');
  } else if (token.liquidityUsd < 50000) {
    score += 20;
    warnings.push('Low liquidity.');
  }

  if (token.volume24h <= 0) {
    score += 20;
    warnings.push('No 24h volume detected.');
  } else if (token.volume24h < 5000) {
    score += 15;
    warnings.push('Low trading volume.');
  }

  const volatility = Math.abs(token.priceChange24h || 0);
  if (volatility >= 50) {
    score += 30;
    warnings.push('Extreme price swings.');
  } else if (volatility >= 25) {
    score += 18;
    warnings.push('High volatility over 24h.');
  } else if (volatility >= 10) {
    score += 8;
    warnings.push('Moderate volatility.');
  }

  if (token.createdAt) {
    const ageDays = (Date.now() - token.createdAt) / 86400000;
    if (ageDays < 2) {
      score += 20;
      warnings.push('Newly listed pair.');
    } else if (ageDays < 7) {
      score += 10;
      warnings.push('Recently launched pair.');
    }
  }

  const riskScore = Math.min(100, Math.max(0, score));
  let label: RiskLabel = 'LOW';
  if (riskScore >= 75) label = 'EXTREME';
  else if (riskScore >= 50) label = 'HIGH';
  else if (riskScore >= 25) label = 'MEDIUM';

  return { riskScore, label, warnings };
}
