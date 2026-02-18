import { useState, useEffect, useCallback } from 'react';

const translations = {
  ko: {
    search: '검색...',
    changeCategory: '카테고리 변경',
    addCategory: '카테고리 추가',
    editCategory: '카테고리 편집',
    deleteGroup: '그룹 삭제',
    addCategoryToGroup: '이 그룹에 카테고리 추가',
    categoryName: '카테고리 이름',
    groupNamePlaceholder: '그룹 이름 (예: 부업/수입)',
    appTitle: '돈플로우',
    tryDemoData: '데모 데이터 체험',
    clearDemoData: '데모 데이터 삭제',
    noBudgetYet: '아직 예산 계획이 없어요',
    goToStructure: '구조 설계하러 가기 →',
  },
  en: {
    search: 'Search...',
    changeCategory: 'Change category',
    addCategory: 'Add category',
    editCategory: 'Edit category',
    deleteGroup: 'Delete group',
    addCategoryToGroup: 'Add category to this group',
    categoryName: 'Category name',
    groupNamePlaceholder: 'Group name (e.g. Side job/Income)',
    appTitle: 'DonFlow - Budget Planner',
    tryDemoData: 'Try Demo Data',
    clearDemoData: 'Clear Demo Data',
    noBudgetYet: 'No budget plan yet',
    goToStructure: 'Go to Structure →',
  },
} as const;

export type Lang = 'ko' | 'en';
export type TKey = keyof typeof translations.ko;

function detectLang(): Lang {
  const saved = localStorage.getItem('donflow-lang') as Lang | null;
  if (saved === 'ko' || saved === 'en') return saved;
  return navigator.language.startsWith('ko') ? 'ko' : 'en';
}

let currentLang: Lang = detectLang();
const listeners = new Set<() => void>();

export function getLang(): Lang { return currentLang; }

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem('donflow-lang', lang);
  document.title = translations[lang].appTitle;
  listeners.forEach(fn => fn());
}

export function t(key: TKey): string {
  return translations[currentLang][key];
}

export function useLanguage() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender(n => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { lang: currentLang, setLang, t };
}

// Set initial title
if (typeof document !== 'undefined') {
  document.title = translations[currentLang].appTitle;
}
