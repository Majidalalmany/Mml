import { db, collection, addDoc } from './firebase';
import { AuditLog, AdminUser } from '../types';

export async function logSystemActivity({
  action,
  performedBy,
  userEmail,
  userRole,
  targetType,
  targetName,
  details,
  severity = 'info'
}: {
  action: string;
  performedBy: string;
  userEmail?: string;
  userRole?: string;
  targetType: AuditLog['targetType'];
  targetName?: string;
  details?: string;
  severity?: AuditLog['severity'];
}) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      performedBy,
      userEmail: userEmail || 'system@jahez.com',
      userRole: userRole || 'general_manager',
      targetType,
      targetName: targetName || '',
      details: details || '',
      severity,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed logging activity to Firestore:', error);
  }
}
