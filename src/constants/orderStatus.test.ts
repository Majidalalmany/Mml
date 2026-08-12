import { describe, it, expect } from 'vitest';
import { ORDER_STATUS_LABELS, ORDER_STATUS_CONFIG } from './orderStatus';
import { OrderStatus } from '../types';

const ALL_STATUSES: OrderStatus[] = [
  'NEW',
  'PREPARING',
  'DELIVERING',
  'COMPLETED',
  'CANCELLED',
  'new',
  'preparing',
  'delivering',
  'delivered',
  'cancelled',
  'returned',
];

describe('ORDER_STATUS_LABELS', () => {
  it('has a non-empty label for every status', () => {
    for (const status of ALL_STATUSES) {
      expect(ORDER_STATUS_LABELS[status], `missing label for ${status}`).toBeTruthy();
    }
  });

  it('uses the same label for matching upper/lowercase statuses', () => {
    expect(ORDER_STATUS_LABELS.NEW).toBe(ORDER_STATUS_LABELS.new);
    expect(ORDER_STATUS_LABELS.PREPARING).toBe(ORDER_STATUS_LABELS.preparing);
    expect(ORDER_STATUS_LABELS.DELIVERING).toBe(ORDER_STATUS_LABELS.delivering);
    expect(ORDER_STATUS_LABELS.CANCELLED).toBe(ORDER_STATUS_LABELS.cancelled);
  });
});

describe('ORDER_STATUS_CONFIG', () => {
  it('has a complete config entry for every status', () => {
    for (const status of ALL_STATUSES) {
      const config = ORDER_STATUS_CONFIG[status];
      expect(config, `missing config for ${status}`).toBeTruthy();
      expect(config.label).toBeTruthy();
      expect(config.badgeClass).toBeTruthy();
      expect(config.iconBg).toBeTruthy();
      expect(config.iconColor).toBeTruthy();
      expect(config.borderColor).toBeTruthy();
      expect(config.Icon).toBeTruthy();
    }
  });

  it('uses consistent styling between upper/lowercase variants', () => {
    expect(ORDER_STATUS_CONFIG.NEW.badgeClass).toBe(ORDER_STATUS_CONFIG.new.badgeClass);
    expect(ORDER_STATUS_CONFIG.CANCELLED.badgeClass).toBe(ORDER_STATUS_CONFIG.cancelled.badgeClass);
    expect(ORDER_STATUS_CONFIG.DELIVERING.Icon).toBe(ORDER_STATUS_CONFIG.delivering.Icon);
  });
});
