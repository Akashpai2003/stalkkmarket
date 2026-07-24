# Scoring Engine Strategy Specifications

This document defines the mathematical scoring model used by **Stalk Market** to assess swing trading setups. The scoring engine evaluates a combination of technical momentum, volume profile, market context, and risk variables.

Scores are scaled from **0 to 100**. A higher score represents a higher probability setup that aligns with standard swing trading playbooks.

---

## 1. Score Composition & Weightages

The final score is a weighted sum of three core categories:

| Category | Weight | Focus Area |
| :--- | :--- | :--- |
| **Technicals** | **55%** | Momentum, Moving Averages, and Volume Profiles |
| **Market Context** | **25%** | Index Alignment and Sector Performance |
| **Risk Metrics** | **20%** | Volatility Penalties and Event Proximity |

---

## 2. Category Detail & Scoring Logic

### A. Technicals (55 Points Max)

1. **Relative Strength Index (RSI - 15 Points)**:
   * **RSI between 55 and 68**: 15 points (ideal bullish range indicating strong momentum without being overbought).
   * **RSI between 45 and 54**: 10 points (consolidation/bouncing off support).
   * **RSI > 70 (Overbought) or < 30 (Oversold)**: 5 points (risk of mean reversion or extreme downtrend).
   
2. **Volume Expansion (15 Points)**:
   * Compares the current day's volume against the 20-day simple moving average volume.
   * **Volume Ratio > 2.0x**: 15 points (strong institutional volume confirmation).
   * **Volume Ratio between 1.2x and 2.0x**: 10 points (moderate expansion).
   * **Volume Ratio < 1.0x**: 0 points (lack of breakout interest).

3. **Moving Average Structure (15 Points)**:
   * Assesses alignment of the price relative to key exponential moving averages (EMA 20, EMA 50, EMA 200).
   * **Price > EMA 20 > EMA 50 > EMA 200**: 15 points (perfect uptrend alignment).
   * **Price > EMA 20 and Price > EMA 50, but EMA 50 < EMA 200**: 10 points (early trend reversal).
   * **Price < EMA 50**: 0 points (weak structure, ineligible for long swing setups).

4. **Trend Strength (ADX - 10 Points)**:
   * **ADX > 25 (Strong Trend)**: 10 points.
   * **ADX between 15 and 25**: 5 points.
   * **ADX < 15**: 0 points (rangebound, trendless).

---

### B. Market Context (25 Points Max)

1. **Index Trend (Nifty 50 - 15 Points)**:
   * Swing setups succeed at a higher rate when aligned with the broader market direction.
   * **Nifty 50 > EMA 20 (on daily chart)**: 15 points (bullish market window).
   * **Nifty 50 < EMA 20 but Nifty 50 > EMA 200**: 5 points (defensive, cautious exposure).
   * **Nifty 50 < EMA 200**: 0 points (bear market, high cash preservation advised).

2. **Sector Strength (10 Points)**:
   * Evaluates if the stock belongs to an outperforming sector (relative strength of Nifty IT, Nifty Auto, Nifty Bank, Nifty Infra, etc. over a rolling 1-month window).
   * **Top 3 Sectors**: 10 points.
   * **Neutral Sectors**: 5 points.
   * **Underperforming Sectors**: 0 points.

---

### C. Risk Metrics (20 Points Max - Subtracting Penalties)

Risk scores start at 20 points, and points are deducted based on risk conditions:

1. **Volatility Penalty (Beta / ATR - 10 Points)**:
   * Higher volatility represents wider stop-loss requirements and smaller optimal position sizes.
   * **Beta > 1.5**: Deduct 5 points.
   * **Beta < 0.8 (Low liquidity risk)**: Deduct 2 points.
   * **Beta between 0.9 and 1.3**: 0 deduction (ideal swing volatility).

2. **Earnings Proximity (10 Points)**:
   * Holding swing positions through binary earnings events introduces high overnight gap risk.
   * **Earnings scheduled within 7 days**: Deduct 10 points.
   * **Earnings scheduled within 8 to 14 days**: Deduct 5 points.
   * **Earnings > 14 days away**: 0 deduction.

---

## 3. Score Rating Categories

The calculated score is classified into the following actions:

* **90+**: Strong Buy / High Conviction Breakout
* **80–89**: Buy / Trend-Following Setup
* **70–79**: Watchlist / Pullback to Support (Wait for confirmation)
* **< 70**: Avoid / High Risk or Lack of Momentum
