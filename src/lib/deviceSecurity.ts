import { db, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc } from './firebase';
import { logAuditEvent } from './auditLogger';

export interface DeviceBlockInfo {
  isBlocked: boolean;
  ip: string;
  deviceId: string;
  reason: string;
  blockedAt: string;
  blockedUntil?: string;
  attemptedEmails: string[];
  totalAttempts: number;
}

const LOCAL_STORAGE_DEVICE_KEY = 'jahez_device_fingerprint';
const LOCAL_STORAGE_ATTEMPTS_KEY = 'jahez_login_failed_attempts';
const LOCAL_STORAGE_BLOCK_KEY = 'jahez_security_device_block';

// Thresholds for auto-banning:
// 1. Trying 2 or more distinct usernames with failed passwords from the same IP/Device (Brute force / account harvesting)
// 2. Or 4 total failed password attempts within 30 minutes
export const MAX_ALLOWED_FAILED_ATTEMPTS = 4;
export const MAX_DISTINCT_FAILED_USERNAMES = 2;
export const ATTEMPT_WINDOW_MINUTES = 30;
export const BLOCK_DURATION_HOURS = 24; // Auto-ban duration in hours

/**
 * Generates or retrieves a persistent unique fingerprint for the current device/browser.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'unknown-server-env';
  
  let deviceId = localStorage.getItem(LOCAL_STORAGE_DEVICE_KEY);
  if (!deviceId) {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const userAgent = navigator.userAgent;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const randomPart = Math.random().toString(36).substring(2, 10);
    const hashSeed = `${screenInfo}_${timezone}_${randomPart}_${Date.now()}`;
    
    let hash = 0;
    for (let i = 0; i < hashSeed.length; i++) {
      hash = ((hash << 5) - hash) + hashSeed.charCodeAt(i);
      hash |= 0;
    }
    
    deviceId = `DEV-${Math.abs(hash).toString(36).toUpperCase()}-${randomPart.toUpperCase()}`;
    localStorage.setItem(LOCAL_STORAGE_DEVICE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Fetches the public IP address of the client device with fallback.
 */
let cachedIp: string | null = null;

export async function getClientIp(): Promise<string> {
  if (cachedIp) return cachedIp;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.ip) {
        cachedIp = String(data.ip).trim();
        sessionStorage.setItem('jahez_client_ip', cachedIp);
        return cachedIp;
      }
    }
  } catch (err) {
    // Network timeout or blocked by client privacy extension
  }

  // Fallback to session cached or generate deterministic fallback IP
  const sessionIp = sessionStorage.getItem('jahez_client_ip');
  if (sessionIp) {
    cachedIp = sessionIp;
    return sessionIp;
  }

  cachedIp = '127.0.0.1';
  return cachedIp;
}

/**
 * Checks if the device or IP is currently blocked in localStorage or Firestore.
 */
export async function checkDeviceSecurityStatus(): Promise<DeviceBlockInfo> {
  const deviceId = getDeviceFingerprint();
  const ip = await getClientIp();

  // 1. Fast check in localStorage
  try {
    const localBlockJson = localStorage.getItem(LOCAL_STORAGE_BLOCK_KEY);
    if (localBlockJson) {
      const localBlock = JSON.parse(localBlockJson);
      const now = Date.now();
      const until = new Date(localBlock.blockedUntil).getTime();

      if (until > now) {
        return {
          isBlocked: true,
          ip: localBlock.ip || ip,
          deviceId,
          reason: localBlock.reason || 'تم حظر الجهاز لتكرار محاولات الدخول الخاطئة.',
          blockedAt: localBlock.blockedAt,
          blockedUntil: localBlock.blockedUntil,
          attemptedEmails: localBlock.attemptedEmails || [],
          totalAttempts: localBlock.totalAttempts || 4
        };
      } else {
        // Expired local block
        localStorage.removeItem(LOCAL_STORAGE_BLOCK_KEY);
      }
    }
  } catch (err) {
    console.warn('Local block parse warning:', err);
  }

  // 2. Check Firestore security_blocks by deviceId or IP
  try {
    const deviceDoc = await getDoc(doc(db, 'security_blocks', deviceId));
    if (deviceDoc.exists()) {
      const data = deviceDoc.data();
      if (data.status === 'active') {
        const until = data.blockedUntil ? new Date(data.blockedUntil).getTime() : Date.now() + 86400000;
        if (until > Date.now()) {
          // Sync to localStorage
          localStorage.setItem(LOCAL_STORAGE_BLOCK_KEY, JSON.stringify({
            ...data,
            deviceId
          }));
          return {
            isBlocked: true,
            ip: data.ip || ip,
            deviceId,
            reason: data.reason || 'تم حظر هذا الجهاز تلقائياً من قبل منظومة الحماية.',
            blockedAt: data.blockedAt,
            blockedUntil: data.blockedUntil,
            attemptedEmails: data.attemptedEmails || [],
            totalAttempts: data.totalAttempts || 4
          };
        }
      }
    }

    // Check by IP if not localhost
    if (ip && ip !== '127.0.0.1') {
      const ipQuery = query(
        collection(db, 'security_blocks'),
        where('ip', '==', ip),
        where('status', '==', 'active')
      );
      const snap = await getDocs(ipQuery);
      if (!snap.empty) {
        const ipBlockDoc = snap.docs[0];
        const data = ipBlockDoc.data();
        const until = data.blockedUntil ? new Date(data.blockedUntil).getTime() : Date.now() + 86400000;
        if (until > Date.now()) {
          localStorage.setItem(LOCAL_STORAGE_BLOCK_KEY, JSON.stringify({
            ...data,
            deviceId
          }));
          return {
            isBlocked: true,
            ip,
            deviceId,
            reason: data.reason || 'تم حظر عنوان الـ IP هذا لتكرار محاولات الدخول الخاطئة.',
            blockedAt: data.blockedAt,
            blockedUntil: data.blockedUntil,
            attemptedEmails: data.attemptedEmails || [],
            totalAttempts: data.totalAttempts || 4
          };
        }
      }
    }
  } catch (dbErr) {
    console.warn('Firestore security block check warning:', dbErr);
  }

  return {
    isBlocked: false,
    ip,
    deviceId,
    reason: '',
    blockedAt: '',
    attemptedEmails: [],
    totalAttempts: 0
  };
}

/**
 * Handles a failed login attempt:
 * Tracks attempted email/username, counts attempts from this device/IP,
 * and triggers automated ban if thresholds are breached.
 */
export async function recordFailedLoginAttempt(attemptedEmail: string): Promise<{
  isBlockedNow: boolean;
  blockInfo?: DeviceBlockInfo;
  remainingAttempts: number;
  distinctUsersTried: number;
}> {
  const deviceId = getDeviceFingerprint();
  const ip = await getClientIp();
  const cleanEmail = attemptedEmail.trim().toLowerCase();
  const now = Date.now();
  const windowMs = ATTEMPT_WINDOW_MINUTES * 60 * 1000;

  // Retrieve current attempt records
  let attempts: { email: string; timestamp: number }[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ATTEMPTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter only attempts within active window
        attempts = parsed.filter(a => typeof a.timestamp === 'number' && now - a.timestamp < windowMs);
      }
    }
  } catch (e) {
    attempts = [];
  }

  // Append new failed attempt
  attempts.push({
    email: cleanEmail,
    timestamp: now
  });

  // Calculate stats
  const distinctEmails = Array.from(new Set(attempts.map(a => a.email).filter(Boolean)));
  const totalAttempts = attempts.length;

  localStorage.setItem(LOCAL_STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));

  // Check ban conditions:
  // 1. Multiple distinct usernames/emails entered wrongly (>= 2 distinct users)
  // 2. OR excessive wrong password attempts (>= 4 attempts)
  const isMultipleUsersAttack = distinctEmails.length >= MAX_DISTINCT_FAILED_USERNAMES;
  const isTooManyAttempts = totalAttempts >= MAX_ALLOWED_FAILED_ATTEMPTS;

  if (isMultipleUsersAttack || isTooManyAttempts) {
    const reason = isMultipleUsersAttack 
      ? `رصد محاولة اختراق بتجربة حسابات متعددة (${distinctEmails.length} حسابات مختلفة) من نفس الجهاز والـ IP.`
      : `تجاوز الحد الأقصى لمحاولات تسجيل الدخول الخاطئة (${totalAttempts} محاولات متتالية).`;

    const blockedAt = new Date().toISOString();
    const blockedUntilDate = new Date(Date.now() + BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    const blockedUntil = blockedUntilDate.toISOString();

    const blockData: DeviceBlockInfo = {
      isBlocked: true,
      ip,
      deviceId,
      reason,
      blockedAt,
      blockedUntil,
      attemptedEmails: distinctEmails,
      totalAttempts
    };

    // 1. Save to localStorage immediately
    localStorage.setItem(LOCAL_STORAGE_BLOCK_KEY, JSON.stringify(blockData));
    localStorage.removeItem(LOCAL_STORAGE_ATTEMPTS_KEY);

    // 2. Save to Firestore `security_blocks`
    try {
      await setDoc(doc(db, 'security_blocks', deviceId), {
        ...blockData,
        status: 'active',
        createdAt: blockedAt,
        updatedAt: blockedAt
      }, { merge: true });

      // If distinct IP, record under IP collection identifier too
      if (ip && ip !== '127.0.0.1') {
        const safeIpKey = `ip_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
        await setDoc(doc(db, 'security_blocks', safeIpKey), {
          ...blockData,
          status: 'active',
          isIpBlock: true,
          createdAt: blockedAt,
          updatedAt: blockedAt
        }, { merge: true });
      }
    } catch (saveErr) {
      console.error('Failed saving security block to Firestore:', saveErr);
    }

    // 3. Log high-severity audit event
    try {
      await logAuditEvent({
        action: 'DEVICE_IP_AUTO_BANNED',
        performedBy: `نظام الحماية والأمان التلقائي (IP: ${ip})`,
        userEmail: cleanEmail,
        userRole: 'security_system',
        targetType: 'system',
        targetName: deviceId,
        details: `تم حظر الجهاز [${deviceId}] وعنوان IP [${ip}] تلقائياً. السبب: ${reason}. الحسابات المستهدفة: ${distinctEmails.join(', ')}`,
        severity: 'critical'
      });
    } catch (logErr) {
      console.warn('Audit log warning:', logErr);
    }

    return {
      isBlockedNow: true,
      blockInfo: blockData,
      remainingAttempts: 0,
      distinctUsersTried: distinctEmails.length
    };
  }

  const remainingAttempts = Math.max(0, MAX_ALLOWED_FAILED_ATTEMPTS - totalAttempts);

  return {
    isBlockedNow: false,
    remainingAttempts,
    distinctUsersTried: distinctEmails.length
  };
}

/**
 * Clears failed attempt counters upon a successful legitimate login.
 */
export function clearLoginAttemptCounters(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_ATTEMPTS_KEY);
  } catch (e) {
    // Ignore storage exceptions
  }
}

/**
 * Emergency unblock function (e.g. for Super Admin manual release)
 */
export async function releaseDeviceSecurityBlock(deviceId: string, ip?: string): Promise<boolean> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_BLOCK_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ATTEMPTS_KEY);

    if (deviceId) {
      await setDoc(doc(db, 'security_blocks', deviceId), {
        status: 'unblocked',
        unblockedAt: new Date().toISOString()
      }, { merge: true });
    }

    if (ip && ip !== '127.0.0.1') {
      const safeIpKey = `ip_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await setDoc(doc(db, 'security_blocks', safeIpKey), {
        status: 'unblocked',
        unblockedAt: new Date().toISOString()
      }, { merge: true });
    }

    await logAuditEvent({
      action: 'DEVICE_UNBLOCKED_BY_ADMIN',
      performedBy: 'المدير العام',
      targetType: 'system',
      targetName: deviceId,
      details: `تم رفع الحظر الأمني عن الجهاز [${deviceId}] و IP [${ip || 'N/A'}]`,
      severity: 'warning'
    });

    return true;
  } catch (e) {
    console.error('Error releasing device block:', e);
    return false;
  }
}
