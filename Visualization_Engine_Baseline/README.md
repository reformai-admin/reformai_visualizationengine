# Visualization Engine Baseline

## 🔍 Purpose
This directory contains the **original production visualization engine**. It serves as the "Ground Truth" and active **Reference Baseline** for the entire project.

## ⚖️ Role in the Workflow
Every time a new pipeline version (e.g., Balanced V4.0) is developed, it is run against this baseline in a regression test. 
- **Baseline:** The "Before" state (legacy production logic).
- **Current Pipeline:** The "After" state (newest architectural improvements).

## ⚠️ Usage Warnings
- **DO NOT MODIFY:** This code is a benchmark. Altering it will invalidate all historical regression data.
- **READ ONLY:** Treat this folder as an immutable reference.
- **COMPARISON ONLY:** This engine is used by the regression runners to generate the "Baseline" side of the report.

---
*Maintained for comparative evaluation and regression testing.*
