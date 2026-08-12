import { describe, it, expect } from 'vitest';
import {
  SERVICE_CATEGORIES,
  findServiceCategory,
  isStoreInServiceCategory,
  getCategoryDefaultLogo,
  CATEGORY_DEFAULT_LOGOS,
  DEFAULT_STORE_LOGO,
} from './categoryUtils';
import { Category } from '../types';

describe('findServiceCategory', () => {
  it('returns undefined for empty input or "all"', () => {
    expect(findServiceCategory()).toBeUndefined();
    expect(findServiceCategory('')).toBeUndefined();
    expect(findServiceCategory('all')).toBeUndefined();
  });

  it('matches by id case-insensitively', () => {
    expect(findServiceCategory('restaurants')?.id).toBe('restaurants');
    expect(findServiceCategory('PHARMACIES')?.id).toBe('pharmacies');
  });

  it('matches by exact label', () => {
    expect(findServiceCategory('المطاعم والوجبات السريعة')?.id).toBe('restaurants');
  });

  it('matches by keyword', () => {
    expect(findServiceCategory('صيدلية')?.id).toBe('pharmacies');
    expect(findServiceCategory('برجر')?.id).toBe('restaurants');
  });

  it('matches when the term contains a keyword', () => {
    expect(findServiceCategory('مطعم الشعبي')?.id).toBe('restaurants');
  });

  it('returns undefined for an unrelated term', () => {
    expect(findServiceCategory('xyz-no-match')).toBeUndefined();
  });
});

describe('isStoreInServiceCategory', () => {
  it('returns true when filter is missing or "all"', () => {
    expect(isStoreInServiceCategory({})).toBe(true);
    expect(isStoreInServiceCategory({}, 'all')).toBe(true);
  });

  it('matches by store categoryId equal to service id', () => {
    expect(isStoreInServiceCategory({ categoryId: 'restaurants' }, 'restaurants')).toBe(true);
  });

  it('matches by activityType keyword', () => {
    expect(isStoreInServiceCategory({ activityType: 'مطعم شعبي' }, 'restaurants')).toBe(true);
  });

  it('matches by categoryName when activityType is absent', () => {
    expect(isStoreInServiceCategory({ categoryName: 'صيدلية النور' }, 'pharmacies')).toBe(true);
  });

  it('falls back to direct text comparison', () => {
    expect(isStoreInServiceCategory({ activityType: 'custom-thing' }, 'custom-thing')).toBe(true);
  });

  it('returns false when nothing matches', () => {
    expect(isStoreInServiceCategory({ activityType: 'إلكترونيات' }, 'restaurants')).toBe(false);
  });
});

describe('getCategoryDefaultLogo', () => {
  it('returns the service category logo when id matches', () => {
    expect(getCategoryDefaultLogo('restaurants')).toBe(
      CATEGORY_DEFAULT_LOGOS['المطاعم والوجبات السريعة']
    );
  });

  it('returns the service category logo when name matches', () => {
    expect(getCategoryDefaultLogo(undefined, 'الصيدليات والمستلزمات الطبية')).toBe(
      CATEGORY_DEFAULT_LOGOS['الصيدليات والمستلزمات الطبية']
    );
  });

  it('prefers coverUrl from the matching category object', () => {
    const categories = [
      { id: 'c1', name: 'قسم خاص', coverUrl: 'https://example.com/cover.jpg', order: 1, status: 'active' } as Category,
    ];
    expect(getCategoryDefaultLogo('c1', undefined, categories)).toBe('https://example.com/cover.jpg');
  });

  it('falls back to keyword matching on categoryName', () => {
    expect(getCategoryDefaultLogo(undefined, 'محل عصير طازج')).toBe(DEFAULT_STORE_LOGO);
    expect(getCategoryDefaultLogo(undefined, 'بقالة الحي')).toBe(
      CATEGORY_DEFAULT_LOGOS['السوبرماركت والتموينات']
    );
  });

  it('returns the default logo when nothing matches', () => {
    expect(getCategoryDefaultLogo(undefined, 'unknown category')).toBe(DEFAULT_STORE_LOGO);
    expect(getCategoryDefaultLogo()).toBe(DEFAULT_STORE_LOGO);
  });
});

describe('SERVICE_CATEGORIES', () => {
  it('has unique ids', () => {
    const ids = SERVICE_CATEGORIES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category has a default logo mapped by label', () => {
    for (const cat of SERVICE_CATEGORIES) {
      expect(CATEGORY_DEFAULT_LOGOS[cat.label], `missing logo for ${cat.id}`).toBeTruthy();
    }
  });
});
