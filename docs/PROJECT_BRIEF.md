# SENTINEL — Project Brief

## Overview

**Sentinel** is an AI/ML-powered financial fraud detection and investigation platform built for a 48-hour hackathon. It empowers AML (Anti-Money Laundering) compliance teams and financial crime investigators to rapidly detect, visualize, and adjudicate high-risk transaction patterns, illicit fund flows, and multi-hop mule networks.

## Core Pillars & Features

1. **Behavioral Fingerprinting**: Synthesizes historical habits, typical transacting hours, baseline velocities, and flags statistical anomalies.
2. **Explainable Risk Scoring and Alert Explanation**: Transparent feature attribution and evidence breakdowns instead of opaque black-box verdicts.
3. **Transaction Relationship Graph & Integrated Replay Mode**: Interactive multi-hop entity graph showing money flows, with an in-page chronological replay engine that steps through events and computes risk with strict zero-lookahead.
4. **Human-in-the-Loop Legitimacy Review**: High-throughput triage interface allowing investigators to confirm fraud, dismiss false positives, record audit notes, and feed labeled ground-truth back into the model pipeline.
5. **Adaptive Risk Monitoring**: Dynamic sensitivity controls balancing detection catch rate against investigator fatigue and false positive rates.
6. **Cross-Account Fraud Pattern Detection**: Uncovers coordinated behavior such as rapid fan-out bursts, circular layering loops, and siphon funnels.

## Critical Design Decisions

- **Replay Mode is NOT a separate page**: Replay is built directly into the Transaction Relationship Graph view. It steps chronologically through events, dynamically updating node/edge attributes and the emerging risk assessment.
- **Strict Zero-Lookahead**: In replay and live scoring, features and risk scores are calculated strictly from information available at that exact transaction timestamp. Ground-truth labels never enter inference-time scoring.
- **Local-First Startup**: The repository can be started and developed locally without external infrastructure or database credentials.
