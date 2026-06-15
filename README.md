# PriceShift — Inflation Calculator

A purchasing power calculator for USD and LKR built with React, 
using real historical CPI data from the U.S. Bureau of Labor 
Statistics and IMF/World Bank.

## Features
- 74 years of U.S. CPI-U data (1950–2024)
- 64 years of Sri Lanka CCPI data (1960–2024)
- 6 spending categories per currency
- Interactive area chart with milestone timeline
- Shareable URLs with full state in query params
- Responsive, accessible design

## Tech Stack
React · Vite · Recharts · IMF/BLS CPI Data

## Data Sources
- USD: U.S. Bureau of Labor Statistics, CPI-U series CUUR0000SA0
- LKR: IMF / World Bank annual CPI % change, base index 1960 = 100

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Roadmap
- [ ] Live BLS API integration
- [ ] Backend CPI caching with PostgreSQL
- [ ] React Native mobile app
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Docker containerisation