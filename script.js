/**
 * ============================================================================
 * AURA CALCULATOR - MODERN PRODUCTION JAVASCRIPT
 * Senior Frontend Engineering Architecture (ES6+)
 * ============================================================================
 */

'use strict';

/* ==========================================================================
   1. Audio Synthesizer (Zero external dependencies)
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.enabled = localStorage.getItem('aura_calc_sound') === 'true';
  }

  init() {
    if (!this.audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('aura_calc_sound', String(this.enabled));
    if (this.enabled) this.playTone(600, 'sine', 0.03, 0.05);
    return this.enabled;
  }

  playTone(freq = 440, type = 'sine', duration = 0.04, gainLevel = 0.06) {
    if (!this.enabled) return;
    try {
      this.init();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainLevel, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Graceful fallback if Web Audio is blocked or unsupported
    }
  }

  playNumber() {
    this.playTone(400, 'triangle', 0.025, 0.04);
  }

  playOperator() {
    this.playTone(620, 'sine', 0.04, 0.06);
  }

  playEquals() {
    this.playTone(850, 'sine', 0.06, 0.08);
  }

  playAction() {
    this.playTone(320, 'triangle', 0.03, 0.05);
  }

  playError() {
    this.playTone(180, 'sawtooth', 0.12, 0.08);
  }
}

/* ==========================================================================
   2. Calculation Engine (Pure Logic & Edge-Case Safety)
   ========================================================================== */
class CalculatorEngine {
  constructor() {
    this.MAX_DIGITS = 15;
    this.reset();
  }

  reset() {
    this.currentInput = '0';
    this.previousOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.lastRepeatedOperation = null; // { operator, operand }
    this.hasError = false;
    this.errorMessage = '';
  }

  /**
   * Cleans floating point precision issues (e.g., 0.1 + 0.2 = 0.3)
   */
  static cleanPrecision(num) {
    if (isNaN(num) || !isFinite(num)) return num;
    const precision = 12;
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  /**
   * Formats a raw number or string into a locale formatted string
   */
  static formatNumber(val) {
    if (val === 'Cannot divide by 0' || val === 'Error') return val;
    if (typeof val === 'number') {
      if (isNaN(val) || !isFinite(val)) return 'Error';
      // Scientific notation for huge / tiny numbers
      if (Math.abs(val) >= 1e14 || (Math.abs(val) > 0 && Math.abs(val) < 1e-6)) {
        return val.toExponential(6);
      }
      val = String(val);
    }

    const isNegative = val.startsWith('-');
    let cleaned = isNegative ? val.slice(1) : val;

    const parts = cleaned.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add comma formatting to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const sign = isNegative ? '-' : '';

    if (decimalPart !== undefined) {
      return `${sign}${formattedInteger}.${decimalPart}`;
    }
    return `${sign}${formattedInteger}`;
  }

  inputDigit(digit) {
    if (this.hasError) this.reset();

    if (this.waitingForSecondOperand) {
      this.currentInput = digit;
      this.waitingForSecondOperand = false;
      return;
    }

    // Limit maximum length of digits
    const rawDigits = this.currentInput.replace(/[^0-9]/g, '');
    if (rawDigits.length >= this.MAX_DIGITS) return;

    if (this.currentInput === '0') {
      this.currentInput = digit;
    } else if (this.currentInput === '-0') {
      this.currentInput = '-' + digit;
    } else {
      this.currentInput += digit;
    }
  }

  inputDecimal() {
    if (this.hasError) this.reset();

    if (this.waitingForSecondOperand) {
      this.currentInput = '0.';
      this.waitingForSecondOperand = false;
      return;
    }

    if (!this.currentInput.includes('.')) {
      this.currentInput += '.';
    }
  }

  setOperator(nextOperator) {
    if (this.hasError) return;

    const inputValue = parseFloat(this.currentInput);

    // Operator replacement if user changes mind before entering next operand
    if (this.operator && this.waitingForSecondOperand) {
      this.operator = nextOperator;
      return;
    }

    if (this.previousOperand === null && !isNaN(inputValue)) {
      this.previousOperand = inputValue;
    } else if (this.operator) {
      const result = this.execute(this.previousOperand, inputValue, this.operator);

      if (this.hasError) return;

      this.currentInput = String(result);
      this.previousOperand = result;
    }

    this.waitingForSecondOperand = true;
    this.operator = nextOperator;
    this.lastRepeatedOperation = null;
  }

  execute(operand1, operand2, op) {
    let result = 0;
    switch (op) {
      case '+':
        result = operand1 + operand2;
        break;
      case '-':
        result = operand1 - operand2;
        break;
      case '*':
        result = operand1 * operand2;
        break;
      case '/':
        if (operand2 === 0) {
          this.hasError = true;
          this.errorMessage = 'Cannot divide by 0';
          return this.errorMessage;
        }
        result = operand1 / operand2;
        break;
      default:
        return operand2;
    }

    result = CalculatorEngine.cleanPrecision(result);

    if (isNaN(result) || !isFinite(result)) {
      this.hasError = true;
      this.errorMessage = 'Error';
      return this.errorMessage;
    }

    return result;
  }

  calculateEquals() {
    if (this.hasError) return null;

    let operand1 = this.previousOperand;
    let operand2 = parseFloat(this.currentInput);
    let op = this.operator;
    let computedResult;

    if (op && operand1 !== null) {
      computedResult = this.execute(operand1, operand2, op);
      if (this.hasError) return { error: this.errorMessage };

      // Record for repeated equals calculation
      this.lastRepeatedOperation = { operator: op, operand: operand2 };

      const calculationRecord = {
        expression: `${CalculatorEngine.formatNumber(operand1)} ${this.getOperatorSymbol(op)} ${CalculatorEngine.formatNumber(operand2)} =`,
        result: CalculatorEngine.formatNumber(computedResult),
        rawResult: computedResult,
      };

      this.currentInput = String(computedResult);
      this.previousOperand = null;
      this.operator = null;
      this.waitingForSecondOperand = true;

      return calculationRecord;
    } else if (this.lastRepeatedOperation) {
      // Repeated equals behavior: apply previous operation with stored operand
      operand1 = parseFloat(this.currentInput);
      operand2 = this.lastRepeatedOperation.operand;
      op = this.lastRepeatedOperation.operator;

      computedResult = this.execute(operand1, operand2, op);
      if (this.hasError) return { error: this.errorMessage };

      const calculationRecord = {
        expression: `${CalculatorEngine.formatNumber(operand1)} ${this.getOperatorSymbol(op)} ${CalculatorEngine.formatNumber(operand2)} =`,
        result: CalculatorEngine.formatNumber(computedResult),
        rawResult: computedResult,
      };

      this.currentInput = String(computedResult);
      this.waitingForSecondOperand = true;

      return calculationRecord;
    }

    return null;
  }

  percent() {
    if (this.hasError) return;

    let current = parseFloat(this.currentInput);
    if (isNaN(current)) return;

    if (this.previousOperand !== null && (this.operator === '+' || this.operator === '-')) {
      // Standard percentage of base: 200 + 10% = 200 + 20
      current = (this.previousOperand * current) / 100;
    } else {
      current = current / 100;
    }

    current = CalculatorEngine.cleanPrecision(current);
    this.currentInput = String(current);
  }

  negate() {
    if (this.hasError) return;

    if (this.currentInput.startsWith('-')) {
      this.currentInput = this.currentInput.slice(1);
    } else if (this.currentInput !== '0') {
      this.currentInput = '-' + this.currentInput;
    } else {
      this.currentInput = '-0';
    }
  }

  backspace() {
    if (this.hasError) {
      this.reset();
      return;
    }

    if (this.waitingForSecondOperand) {
      return;
    }

    if (this.currentInput.length === 1 || (this.currentInput.length === 2 && this.currentInput.startsWith('-'))) {
      this.currentInput = '0';
    } else {
      this.currentInput = this.currentInput.slice(0, -1);
      if (this.currentInput === '-' || this.currentInput === '') {
        this.currentInput = '0';
      }
    }
  }

  getOperatorSymbol(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return '';
    }
  }

  getExpressionText() {
    if (this.hasError) return '';
    if (this.previousOperand !== null && this.operator) {
      return `${CalculatorEngine.formatNumber(this.previousOperand)} ${this.getOperatorSymbol(this.operator)}`;
    }
    return '';
  }
}

/* ==========================================================================
   3. History Manager (localStorage persistence)
   ========================================================================== */
class HistoryManager {
  constructor(onSelectHistoryItem) {
    this.STORAGE_KEY = 'aura_calc_history';
    this.MAX_HISTORY = 30;
    this.onSelectHistoryItem = onSelectHistoryItem;
    this.items = this.loadHistory();
  }

  loadHistory() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
    } catch {
      // Ignore quota errors
    }
  }

  addEntry(expression, result, rawResult) {
    const entry = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      expression,
      result,
      rawResult,
      timestamp: Date.now(),
    };

    this.items.unshift(entry);
    if (this.items.length > this.MAX_HISTORY) {
      this.items = this.items.slice(0, this.MAX_HISTORY);
    }
    this.saveHistory();
    this.render();
  }

  clearAll() {
    this.items = [];
    this.saveHistory();
    this.render();
  }

  render() {
    const listEl = document.getElementById('history-list');
    const emptyEl = document.getElementById('history-empty');
    const badgeEl = document.getElementById('history-badge');

    if (!listEl || !emptyEl || !badgeEl) return;

    // Update count badge
    if (this.items.length > 0) {
      badgeEl.textContent = this.items.length > 99 ? '99+' : this.items.length;
      badgeEl.style.display = 'flex';
      emptyEl.style.display = 'none';
      listEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
      emptyEl.style.display = 'flex';
      listEl.style.display = 'none';
    }

    listEl.innerHTML = '';
    this.items.forEach((item) => {
      const itemBtn = document.createElement('button');
      itemBtn.type = 'button';
      itemBtn.className = 'history-item';
      itemBtn.setAttribute('aria-label', `Restore calculation: ${item.expression} ${item.result}`);

      const exprSpan = document.createElement('span');
      exprSpan.className = 'history-item-expr';
      exprSpan.textContent = item.expression;

      const resSpan = document.createElement('span');
      resSpan.className = 'history-item-res';
      resSpan.textContent = item.result;

      itemBtn.appendChild(exprSpan);
      itemBtn.appendChild(resSpan);

      itemBtn.addEventListener('click', () => {
        if (this.onSelectHistoryItem) {
          this.onSelectHistoryItem(item);
        }
      });

      listEl.appendChild(itemBtn);
    });
  }
}

/* ==========================================================================
   4. Main UI Controller & Event Binding
   ========================================================================== */
class CalculatorApp {
  constructor() {
    this.engine = new CalculatorEngine();
    this.sound = new SoundEngine();
    this.history = new HistoryManager((item) => this.handleHistorySelection(item));

    this.initElements();
    this.initTheme();
    this.initSoundUI();
    this.bindEvents();
    this.updateDisplay();
    this.history.render();
  }

  initElements() {
    this.displayMain = document.getElementById('display-main');
    this.displayExpression = document.getElementById('display-expression');
    this.btnClear = document.getElementById('btn-clear');
    this.btnTheme = document.getElementById('btn-theme');
    this.btnSound = document.getElementById('btn-sound');
    this.btnHistory = document.getElementById('btn-history');
    this.btnCopy = document.getElementById('btn-copy');
    this.displayContainer = document.getElementById('display-container');
    this.toast = document.getElementById('toast-notification');
    this.historyPanel = document.getElementById('history-panel');
    this.btnCloseHistory = document.getElementById('btn-close-history');
    this.btnClearHistory = document.getElementById('btn-clear-history');
    this.metaThemeColor = document.getElementById('meta-theme-color');
    this.operatorButtons = document.querySelectorAll('.btn-operator');
    this.allButtons = document.querySelectorAll('.calc-btn');
  }

  /* --- Theme Handling --- */
  initTheme() {
    const savedTheme = localStorage.getItem('aura_calc_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

    this.setTheme(initialTheme);

    // Watch system theme change if not manually overridden
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('aura_calc_theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aura_calc_theme', theme);

    const sunIcon = this.btnTheme.querySelector('.icon-sun');
    const moonIcon = this.btnTheme.querySelector('.icon-moon');

    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
      if (this.metaThemeColor) this.metaThemeColor.setAttribute('content', '#0d0f12');
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
      if (this.metaThemeColor) this.metaThemeColor.setAttribute('content', '#f1f5f9');
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    this.sound.playAction();
  }

  /* --- Sound UI Handling --- */
  initSoundUI() {
    this.updateSoundIcon();
  }

  updateSoundIcon() {
    const soundOn = this.btnSound.querySelector('.icon-sound-on');
    const soundOff = this.btnSound.querySelector('.icon-sound-off');

    if (this.sound.enabled) {
      soundOn.style.display = 'block';
      soundOff.style.display = 'none';
      this.btnSound.setAttribute('aria-label', 'Mute sound effects');
    } else {
      soundOn.style.display = 'none';
      soundOff.style.display = 'block';
      this.btnSound.setAttribute('aria-label', 'Enable sound effects');
    }
  }

  toggleSound() {
    this.sound.toggle();
    this.updateSoundIcon();
  }

  /* --- History Slide Drawer --- */
  toggleHistory(forceOpen = null) {
    const isOpen = forceOpen !== null ? forceOpen : !this.historyPanel.classList.contains('is-open');
    if (isOpen) {
      this.historyPanel.classList.add('is-open');
      this.historyPanel.setAttribute('aria-hidden', 'false');
      this.btnHistory.setAttribute('aria-expanded', 'true');
    } else {
      this.historyPanel.classList.remove('is-open');
      this.historyPanel.setAttribute('aria-hidden', 'true');
      this.btnHistory.setAttribute('aria-expanded', 'false');
    }
    this.sound.playAction();
  }

  handleHistorySelection(entry) {
    this.engine.reset();
    this.engine.currentInput = String(entry.rawResult);
    this.updateDisplay();
    this.toggleHistory(false);
    this.sound.playNumber();
  }

  /* --- Clipboard Copy --- */
  async copyCurrentValue() {
    const textToCopy = this.engine.currentInput;
    try {
      await navigator.clipboard.writeText(textToCopy);
      this.showToast('Copied to clipboard');
      this.sound.playAction();
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('Copied to clipboard');
    }
  }

  showToast(message) {
    if (!this.toast) return;
    this.toast.textContent = message;
    this.toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 1800);
  }

  /* --- Display Auto-Scaling & Formatting --- */
  updateDisplay() {
    // 1. Update Clear Button Label (AC vs C)
    if (this.engine.currentInput !== '0' && !this.engine.hasError) {
      this.btnClear.textContent = 'C';
      this.btnClear.setAttribute('aria-label', 'Clear current entry');
    } else {
      this.btnClear.textContent = 'AC';
      this.btnClear.setAttribute('aria-label', 'Clear all');
    }

    // 2. Update Expression Display
    this.displayExpression.textContent = this.engine.getExpressionText();

    // 3. Update Main Display Value & Error states
    if (this.engine.hasError) {
      this.displayMain.textContent = this.engine.errorMessage;
      this.displayMain.className = 'display-main error-state';
    } else {
      const formatted = CalculatorEngine.formatNumber(this.engine.currentInput);
      this.displayMain.textContent = formatted;

      // Smart dynamic font scaling
      const charCount = formatted.length;
      this.displayMain.className = 'display-main';
      if (charCount > 13) {
        this.displayMain.classList.add('text-xxs');
      } else if (charCount > 10) {
        this.displayMain.classList.add('text-xs');
      } else if (charCount > 7) {
        this.displayMain.classList.add('text-sm');
      }
    }

    // 4. Update Operator Active Highlighting
    this.operatorButtons.forEach((btn) => {
      const op = btn.getAttribute('data-operator');
      if (this.engine.operator === op && this.engine.waitingForSecondOperand) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  /* --- Action Handlers --- */
  handleNumber(value) {
    this.engine.inputDigit(value);
    this.updateDisplay();
    this.sound.playNumber();
  }

  handleDecimal() {
    this.engine.inputDecimal();
    this.updateDisplay();
    this.sound.playNumber();
  }

  handleOperator(operator) {
    this.engine.setOperator(operator);
    this.updateDisplay();
    if (this.engine.hasError) {
      this.sound.playError();
    } else {
      this.sound.playOperator();
    }
  }

  handleEquals() {
    const result = this.engine.calculateEquals();
    this.updateDisplay();

    if (result && result.error) {
      this.sound.playError();
    } else if (result) {
      this.history.addEntry(result.expression, result.result, result.rawResult);
      this.sound.playEquals();
    } else {
      this.sound.playEquals();
    }
  }

  handleClear() {
    if (this.btnClear.textContent === 'C') {
      // Clear entry only
      this.engine.currentInput = '0';
    } else {
      // All clear
      this.engine.reset();
    }
    this.updateDisplay();
    this.sound.playAction();
  }

  handleNegate() {
    this.engine.negate();
    this.updateDisplay();
    this.sound.playAction();
  }

  handlePercent() {
    this.engine.percent();
    this.updateDisplay();
    this.sound.playAction();
  }

  handleBackspace() {
    this.engine.backspace();
    this.updateDisplay();
    this.sound.playAction();
  }

  /* --- Visual Keyboard Feedback --- */
  flashButton(buttonElement) {
    if (!buttonElement) return;
    buttonElement.classList.add('is-pressed');
    setTimeout(() => {
      buttonElement.classList.remove('is-pressed');
    }, 120);
  }

  /* --- Event Listeners Binding --- */
  bindEvents() {
    // 1. Keypad Click Delegation
    const keypad = document.querySelector('.keypad-grid');
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.calc-btn');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const value = btn.getAttribute('data-value');
      const operator = btn.getAttribute('data-operator');

      this.executeAction(action, value, operator);
      this.flashButton(btn);
    });

    // 2. Header & Action buttons
    this.btnTheme.addEventListener('click', () => this.toggleTheme());
    this.btnSound.addEventListener('click', () => this.toggleSound());
    this.btnHistory.addEventListener('click', () => this.toggleHistory());
    this.btnCloseHistory.addEventListener('click', () => this.toggleHistory(false));
    this.btnClearHistory.addEventListener('click', () => {
      this.history.clearAll();
      this.sound.playAction();
    });

    // 3. Display Copy Interaction
    this.btnCopy.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyCurrentValue();
    });

    this.displayContainer.addEventListener('click', () => {
      this.copyCurrentValue();
    });

    // 4. Global Keyboard Navigation
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  executeAction(action, value, operator) {
    switch (action) {
      case 'number':
        this.handleNumber(value);
        break;
      case 'decimal':
        this.handleDecimal();
        break;
      case 'operator':
        this.handleOperator(operator);
        break;
      case 'equals':
        this.handleEquals();
        break;
      case 'clear':
        this.handleClear();
        break;
      case 'negate':
        this.handleNegate();
        break;
      case 'percent':
        this.handlePercent();
        break;
      case 'backspace':
        this.handleBackspace();
        break;
      default:
        break;
    }
  }

  handleKeyDown(e) {
    // If typing in input/textarea or focusing on modal controls
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key;

    // Digits 0–9
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      this.handleNumber(key);
      const btn = document.querySelector(`.calc-btn[data-action="number"][data-value="${key}"]`);
      this.flashButton(btn);
      return;
    }

    // Decimal point / comma
    if (key === '.' || key === ',') {
      e.preventDefault();
      this.handleDecimal();
      const btn = document.querySelector(`.calc-btn[data-action="decimal"]`);
      this.flashButton(btn);
      return;
    }

    // Operators
    if (key === '+') {
      e.preventDefault();
      this.handleOperator('+');
      const btn = document.querySelector(`.calc-btn[data-operator="+"]`);
      this.flashButton(btn);
      return;
    }
    if (key === '-') {
      e.preventDefault();
      this.handleOperator('-');
      const btn = document.querySelector(`.calc-btn[data-operator="-"]`);
      this.flashButton(btn);
      return;
    }
    if (key === '*' || key === 'x' || key === 'X') {
      e.preventDefault();
      this.handleOperator('*');
      const btn = document.querySelector(`.calc-btn[data-operator="*"]`);
      this.flashButton(btn);
      return;
    }
    if (key === '/') {
      e.preventDefault();
      this.handleOperator('/');
      const btn = document.querySelector(`.calc-btn[data-operator="/"]`);
      this.flashButton(btn);
      return;
    }

    // Equals & Enter
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      this.handleEquals();
      const btn = document.querySelector(`.calc-btn[data-action="equals"]`);
      this.flashButton(btn);
      return;
    }

    // Backspace & Delete
    if (key === 'Backspace') {
      e.preventDefault();
      this.handleBackspace();
      const btn = document.querySelector(`.calc-btn[data-action="backspace"]`);
      this.flashButton(btn);
      return;
    }

    // Escape / Clear
    if (key === 'Escape') {
      e.preventDefault();
      if (this.historyPanel.classList.contains('is-open')) {
        this.toggleHistory(false);
      } else {
        this.handleClear();
        const btn = document.getElementById('btn-clear');
        this.flashButton(btn);
      }
      return;
    }

    // Percentage
    if (key === '%') {
      e.preventDefault();
      this.handlePercent();
      const btn = document.querySelector(`.calc-btn[data-action="percent"]`);
      this.flashButton(btn);
      return;
    }

    // Shortcuts: N / _ for Negate, C for Copy (unless Ctrl/Meta held), T for Theme, S for Sound, H for History
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      if (key.toLowerCase() === 'n' || key === '_') {
        e.preventDefault();
        this.handleNegate();
        const btn = document.querySelector(`.calc-btn[data-action="negate"]`);
        this.flashButton(btn);
      } else if (key.toLowerCase() === 't') {
        e.preventDefault();
        this.toggleTheme();
      } else if (key.toLowerCase() === 's') {
        e.preventDefault();
        this.toggleSound();
      } else if (key.toLowerCase() === 'h') {
        e.preventDefault();
        this.toggleHistory();
      } else if (key.toLowerCase() === 'c') {
        e.preventDefault();
        this.copyCurrentValue();
      }
    }
  }
}

// Instantiate application once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.auraCalculator = new CalculatorApp();
});
