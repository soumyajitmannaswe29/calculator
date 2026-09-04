# Aura Pro · Minimalist Modern Web Calculator

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> A production-quality, minimal premium calculator web application crafted with pure vanilla JavaScript (ES6+), modern CSS3 architecture, and semantic HTML5. Designed to deliver desktop/mobile OS-grade polish, mathematical precision, zero external UI framework dependencies, and rich micro-interactions.

---

## ✨ Features

- **🧮 Robust Calculation Engine**:
  - Full arithmetic support: addition, subtraction, multiplication, division, percentage, sign toggle (`±`).
  - **No `eval()`**: Built on a secure, deterministic finite-state calculation engine.
  - **Repeated Calculations**: Pressing `=` repeatedly reapplies the previous operator and operand (e.g., `5 + 3 = 8 = 11 = 14`).
  - **Operator Chaining & Smooth Replacement**: Supports continuous expressions and seamless operator changes without unwanted evaluations.
  - **Floating-Point Precision Correction**: Eliminates binary IEEE 754 precision artifacts (e.g. `0.1 + 0.2` strictly equals `0.3`).
  - **Intelligent AC / C State**: Switches dynamically between Clear Entry (`C`) and All Clear (`AC`).
  - **Graceful Error Handling**: Safe division-by-zero intercept (`Cannot divide by 0`) and overflow protections.

- **🎨 Minimalist Premium UI & Design Tokens**:
  - Inspired by macOS Sonoma / iOS 18 calculator elegance and Dieter Rams industrial design principles.
  - Glassmorphic translucent cards with CSS `backdrop-filter`, crisp ambient shadows, and responsive grid layouts.
  - **Dynamic Display Auto-Scaling**: Font size automatically downscales as character length increases to guarantee zero horizontal overflow.
  - **Light & Dark Mode**: Persistent theme switching with automatic system preference detection (`prefers-color-scheme`) and mobile `<meta name="theme-color">` synchronization.

- **⌨️ Comprehensive Keyboard Controls & Visual Echo**:
  - Complete numpad and standard keyboard navigation for all operations.
  - **Physical Button Echo**: Pressing physical keys triggers immediate tactile visual feedback on the corresponding on-screen button.

- **📜 Persistent Calculation History**:
  - Slide-over history drawer storing recent calculations with expressions and timestamps.
  - One-click restoration of historical results into active calculator state.
  - LocalStorage persistence and instant clear functionality.

- **📋 Clipboard Integration**:
  - Quick-copy current result or input value directly to clipboard with instant toast alert feedback.

- **🔊 Audio Feedback (Web Audio API Synthesizer)**:
  - 100% synthetic tactile sound blips generated dynamically in code without external MP3/WAV assets.
  - Can be toggled on/off with state persistence.

- **♿ Accessibility & Performance**:
  - WCAG 2.1 AA compliant contrast ratios and `:focus-visible` outlines.
  - Semantic HTML with `aria-live`, `aria-label`, and `role` regions.
  - Respects `prefers-reduced-motion: reduce`.

---

## 🎹 Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `0` – `9` | Input Number Digits |
| `.` or `,` | Decimal Point |
| `+` | Addition |
| `-` | Subtraction |
| `*` or `x` or `X` | Multiplication |
| `/` | Division |
| `Enter` or `=` | Calculate / Equals |
| `Backspace` | Delete last character |
| `Escape` | Clear current entry / All Clear |
| `%` | Percentage calculation |
| `N` or `_` | Toggle Positive / Negative (`±`) |
| `C` | Copy current display value to clipboard |
| `T` | Toggle Dark / Light Theme |
| `S` | Toggle Audio Click Synthesizer |
| `H` | Open / Close History Panel |

---

## 📁 Project Structure

```text
calculator/
│
├── index.html          # Semantic HTML5 layout and accessibility markup
├── style.css           # Design tokens, themes, layout grid, micro-animations
├── script.js           # OOP Calculation Engine, State Machine, Audio & UI controllers
├── README.md           # Documentation & engineering overview
└── .gitignore          # Repository hygiene
```

---

## 🏗️ Architecture & Code Organization

The JavaScript codebase follows senior frontend engineering principles with clean separation of concerns into modular ES6 classes:

1. **`CalculatorEngine`**: Encapsulates arithmetic state machine, operand memory, precision cleaning, and edge-case validations. Completely decoupled from the DOM.
2. **`CalculatorApp`**: Central view-controller managing DOM updates, dynamic font scaling, button echo animations, and event listeners.
3. **`HistoryManager`**: Manages storage, retrieval, serialization, and rendering of calculation logs using `localStorage`.
4. **`SoundEngine`**: Web Audio API oscillator synthesizing custom frequencies for numeric inputs, operators, equals, and error states.

---

## 🚀 Getting Started

### Local Setup (No Build Step Required)

Since this project is built entirely with vanilla web standards:

1. Clone or download the repository:
   ```bash
   git clone https://github.com/your-username/calculator.git
   cd calculator
   ```

2. Open `index.html` in any modern browser:
   - Double click `index.html` in your file explorer, OR
   - Run a local static server:
     ```bash
     # Using Python 3
     python -m http.server 8000

     # Using Node.js (npx)
     npx serve .
     ```

3. Navigate to `http://localhost:8000` in your web browser.

---

## 🧪 Edge Cases Tested

| Test Scenario | Input Example | Expected Behavior |
| :--- | :--- | :--- |
| Divide by Zero | `10 ÷ 0 =` | Displays `"Cannot divide by 0"`, resets on next input |
| Float Precision | `0.1 + 0.2 =` | Clean `0.3` (not `0.30000000000000004`) |
| Multiple Decimals | `5 . . 2` | `5.2` (duplicate dots ignored) |
| Operator Replacement | `5 +` then click `×` | Operator updates to `×`, equation becomes `5 ×` |
| Continuous Operations | `2 + 3 × 4 =` | Evaluates sequentially: `(2+3)=5`, then `5×4=20` |
| Repeated Equals | `10 + 2 =` (12) `=` `=` | Evaluates `14`, then `16` |
| Percentage Base | `200 + 10 % =` | Calculates `200 + 20 = 220` |
| Max Integer Limits | Typing 20 digits | Hard caps at 15 precision digits to prevent numeric overflow |
| Number Scaling | `999,999,999 × 999,999` | Text dynamically resizes; uses scientific notation if threshold exceeded |

---

## 🏷️ GitHub Repository Topics

Recommended topics for GitHub:
`calculator` · `vanilla-javascript` · `javascript` · `html5` · `css3` · `frontend` · `portfolio-project` · `responsive-design` · `web-development` · `glassmorphism` · `clean-code`

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
