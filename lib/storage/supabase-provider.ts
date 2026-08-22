import {
  User,
  MandalSettings,
  Donor,
  Payment,
  Pavti,
  Announcement,
  AuditLog,
  Expense,
  ExpenseSummary,
  DailyExpenseRecord,
  AppMode,
  CollectionSummary,
  DailyCollectionRecord,
  PaymentInstallment,
  UserRole,
} from '@/types';
import bcrypt from 'bcryptjs';
import { IStorageProvider, DatabaseBackup } from './types';
import { LocalStorageProvider } from './local-provider';
import { getSupabaseServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { numberToWordsMarathi, numberToWordsEnglish } from '@/lib/utils/number-to-words';

export class SupabaseStorageProvider implements IStorageProvider {
  name = 'SupabaseStorageProvider';
  private fallbackProvider: LocalStorageProvider;

  get isConfigured(): boolean {
    return isSupabaseServerConfigured();
  }

  constructor() {
    this.fallbackProvider = new LocalStorageProvider();
  }

  async init(): Promise<void> {
    if (!this.isConfigured) {
      console.warn(
        '[SupabaseStorageProvider] Supabase credentials not found. Operating in fallback LocalStorageProvider mode.'
      );
      await this.fallbackProvider.init();
      return;
    }
  }

  private getClient() {
    const client = getSupabaseServerClient();
    if (!client) {
      throw new Error('Supabase client is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    return client;
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================
  async getSettings(): Promise<MandalSettings> {
    if (!this.isConfigured) return this.fallbackProvider.getSettings();

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('mandal_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[SupabaseStorageProvider] getSettings error:', error);
        return this.fallbackProvider.getSettings();
      }

      if (!data) {
        return this.fallbackProvider.getSettings();
      }

      return this.mapSettingsFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getSettings fallback error:', err);
      return this.fallbackProvider.getSettings();
    }
  }

  async saveSettings(settings: MandalSettings): Promise<MandalSettings> {
    if (!this.isConfigured) return this.fallbackProvider.saveSettings(settings);

    try {
      const client = this.getClient();
      const payload = {
        id: settings.id || 'mandal-settings-default',
        mandal_name_marathi: settings.mandalNameMarathi,
        mandal_name_english: settings.mandalNameEnglish,
        reg_number: settings.regNumber || '',
        location_marathi: settings.locationMarathi || '',
        location_english: settings.locationEnglish || '',
        address_marathi: settings.addressMarathi || '',
        address_english: settings.addressEnglish || '',
        contact_number: settings.contactNumber || '',
        alternate_contact: settings.alternateContact || '',
        whatsapp_group_link: settings.whatsappGroupLink || '',
        default_whatsapp_message: (settings as any).defaultWhatsAppMessage || '',
        year: settings.year || '२०२६',
        logo_url: settings.logoUrl || null,
        tagline_marathi: settings.taglineMarathi || '',
        slogan_marathi: settings.sloganMarathi || '',
        receipt_prefix: settings.receiptPrefix || '',
        starting_receipt_number: settings.startingReceiptNumber || 1,
        enable_partial_payments: settings.enablePartialPayments ?? true,
        enable_whatsapp_group_invite: settings.enableWhatsAppGroupInvite ?? true,
        designations: settings.designations || [],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('mandal_settings')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return this.mapSettingsFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] saveSettings error:', err);
      return this.fallbackProvider.saveSettings(settings);
    }
  }

  // ============================================================================
  // USERS
  // ============================================================================
  async getUsers(): Promise<User[]> {
    if (!this.isConfigured) return this.fallbackProvider.getUsers();

    try {
      const client = this.getClient();
      const { data, error } = await client.from('users').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(this.mapUserFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getUsers error:', err);
      return this.fallbackProvider.getUsers();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.isConfigured) return this.fallbackProvider.getUserById(id);

    try {
      const client = this.getClient();
      const { data, error } = await client.from('users').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? this.mapUserFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getUserById error:', err);
      return this.fallbackProvider.getUserById(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.isConfigured) return this.fallbackProvider.getUserByEmail(email);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('users')
        .select('*')
        .ilike('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapUserFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getUserByEmail error:', err);
      return this.fallbackProvider.getUserByEmail(email);
    }
  }

  async saveUser(user: User): Promise<User> {
    if (!this.isConfigured) return this.fallbackProvider.saveUser(user);

    try {
      const client = this.getClient();
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        password_hash: user.passwordHash,
        role: user.role,
        phone: user.phone || null,
        active: user.active ?? true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('users')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return this.mapUserFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] saveUser error:', err);
      return this.fallbackProvider.saveUser(user);
    }
  }

  async updateUserPassword(
    userId: string,
    newPassword: string,
    performedBy: { userId: string; userName: string; userRole: UserRole }
  ): Promise<boolean> {
    if (performedBy.userRole !== 'SUPER_ADMIN') {
      throw new Error('अनधिकृत: फक्त सुपर ॲडमिन पासवर्ड बदलू शकतात (Only Super Admin can change passwords).');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('पासवर्ड किमान ६ अक्षरांचा असावा (Password must be at least 6 characters).');
    }

    const targetUser = await this.getUserById(userId);
    if (!targetUser) {
      throw new Error('वापरकर्ता सापडला नाही (User not found).');
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);

    // Always update fallback local provider
    try {
      const localUser = (await this.fallbackProvider.getUserById(userId)) || (await this.fallbackProvider.getUserByEmail(targetUser.email));
      if (localUser) {
        await this.fallbackProvider.updateUserPassword(localUser.id, newPassword, performedBy);
      }
    } catch (fbErr) {
      console.warn('[SupabaseStorageProvider] Fallback password update notice:', fbErr);
    }

    if (!this.isConfigured) return true;

    try {
      const client = this.getClient();

      // 1. Update password directly in Supabase Auth using Supabase Admin Auth API
      const { data: authUsers, error: listErr } = await client.auth.admin.listUsers();
      if (!listErr && authUsers && authUsers.users) {
        const authUser = authUsers.users.find(
          (u) => u.email?.toLowerCase() === targetUser.email.toLowerCase()
        );

        if (authUser) {
          const { error: updateAuthErr } = await client.auth.admin.updateUserById(authUser.id, {
            password: newPassword.trim(),
            user_metadata: {
              name: targetUser.name,
              role: targetUser.role,
            },
          });
          if (updateAuthErr) console.warn('[Supabase Auth Admin] updateUserById warning:', updateAuthErr.message);
        } else {
          const { error: createAuthErr } = await client.auth.admin.createUser({
            email: targetUser.email,
            password: newPassword.trim(),
            email_confirm: true,
            user_metadata: {
              name: targetUser.name,
              role: targetUser.role,
            },
          });
          if (createAuthErr) console.warn('[Supabase Auth Admin] createUser warning:', createAuthErr.message);
        }
      }

      // 2. Update password_hash and updated_at on public.users table in Supabase
      const { error: userTableErr } = await client
        .from('users')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (userTableErr) {
        console.error('[SupabaseStorageProvider] users table update error:', userTableErr.message);
      }

      await this.addAuditLog({
        userId: performedBy.userId,
        userName: performedBy.userName,
        userRole: performedBy.userRole,
        action: 'PASSWORD_CHANGED',
        entityType: 'USER',
        entityId: targetUser.id,
        details: `Super Admin (${performedBy.userName}) changed password for ${targetUser.role} account "${targetUser.name}" (${targetUser.email}).`,
        mode: 'LIVE',
      });

      return true;
    } catch (err) {
      console.error('[SupabaseStorageProvider] updateUserPassword error:', err);
      return true;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    if (!this.isConfigured) return this.fallbackProvider.deleteUser(id);

    try {
      const client = this.getClient();
      const { error } = await client.from('users').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[SupabaseStorageProvider] deleteUser error:', err);
      return this.fallbackProvider.deleteUser(id);
    }
  }

  // ============================================================================
  // DONORS
  // ============================================================================
  async getDonors(mode: AppMode): Promise<Donor[]> {
    if (!this.isConfigured) return this.fallbackProvider.getDonors(mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('donors')
        .select('*')
        .eq('mode', mode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapDonorFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getDonors error:', err);
      return this.fallbackProvider.getDonors(mode);
    }
  }

  async getDonorById(id: string, mode: AppMode): Promise<Donor | null> {
    if (!this.isConfigured) return this.fallbackProvider.getDonorById(id, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('donors')
        .select('*')
        .eq('id', id)
        .eq('mode', mode)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapDonorFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getDonorById error:', err);
      return this.fallbackProvider.getDonorById(id, mode);
    }
  }

  async getDonorByMobile(mobile: string, mode: AppMode): Promise<Donor | null> {
    if (!this.isConfigured) return this.fallbackProvider.getDonorByMobile(mobile, mode);

    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const client = this.getClient();
      const { data, error } = await client
        .from('donors')
        .select('*')
        .eq('mode', mode)
        .eq('mobile', cleanMobile)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapDonorFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getDonorByMobile error:', err);
      return this.fallbackProvider.getDonorByMobile(mobile, mode);
    }
  }

  async saveDonor(donor: Donor, mode: AppMode): Promise<Donor> {
    if (!this.isConfigured) return this.fallbackProvider.saveDonor(donor, mode);

    try {
      const client = this.getClient();
      const payload = {
        id: donor.id,
        name: donor.name.trim(),
        mobile: donor.mobile ? donor.mobile.replace(/\D/g, '') : '',
        address: donor.address?.trim() || '',
        total_contributed: donor.totalContributed || 0,
        pavti_count: donor.pavtiCount || 0,
        last_payment_date: donor.lastPaymentDate || null,
        mode: mode,
        notes: donor.notes || null,
        is_archived: donor.isArchived ?? false,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('donors')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return this.mapDonorFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] saveDonor error:', err);
      return this.fallbackProvider.saveDonor(donor, mode);
    }
  }

  async deleteOrArchiveDonor(
    donorId: string,
    mode: AppMode
  ): Promise<{ success: boolean; action: 'DELETED' | 'ARCHIVED' }> {
    if (!this.isConfigured) return this.fallbackProvider.deleteOrArchiveDonor(donorId, mode);

    try {
      const client = this.getClient();
      const [{ count: paymentCount }, { count: pavtiCount }] = await Promise.all([
        client.from('payments').select('id', { count: 'exact', head: true }).eq('donor_id', donorId),
        client.from('pavtis').select('id', { count: 'exact', head: true }).eq('donor_id', donorId),
      ]);

      const hasFinancialHistory = (paymentCount || 0) > 0 || (pavtiCount || 0) > 0;

      if (hasFinancialHistory) {
        const { error } = await client
          .from('donors')
          .update({ is_archived: true, updated_at: new Date().toISOString() })
          .eq('id', donorId)
          .eq('mode', mode);

        if (error) throw error;
        return { success: true, action: 'ARCHIVED' };
      } else {
        const { error } = await client.from('donors').delete().eq('id', donorId).eq('mode', mode);
        if (error) throw error;
        return { success: true, action: 'DELETED' };
      }
    } catch (err) {
      console.error('[SupabaseStorageProvider] deleteOrArchiveDonor error:', err);
      return this.fallbackProvider.deleteOrArchiveDonor(donorId, mode);
    }
  }

  async searchDonors(query: string, mode: AppMode): Promise<Donor[]> {
    if (!this.isConfigured) return this.fallbackProvider.searchDonors(query, mode);

    try {
      const q = query.trim();
      if (!q) return this.getDonors(mode);

      const client = this.getClient();
      const { data, error } = await client
        .from('donors')
        .select('*')
        .eq('mode', mode)
        .or(`name.ilike.%${q}%,mobile.ilike.%${q}%,address.ilike.%${q}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapDonorFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] searchDonors error:', err);
      return this.fallbackProvider.searchDonors(query, mode);
    }
  }

  // ============================================================================
  // PAYMENTS
  // ============================================================================
  async getPayments(mode: AppMode): Promise<Payment[]> {
    if (!this.isConfigured) return this.fallbackProvider.getPayments(mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('payments')
        .select('*')
        .eq('mode', mode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapPaymentFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPayments error:', err);
      return this.fallbackProvider.getPayments(mode);
    }
  }

  async getPaymentById(id: string, mode: AppMode): Promise<Payment | null> {
    if (!this.isConfigured) return this.fallbackProvider.getPaymentById(id, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('payments')
        .select('*')
        .eq('id', id)
        .eq('mode', mode)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapPaymentFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPaymentById error:', err);
      return this.fallbackProvider.getPaymentById(id, mode);
    }
  }

  async getPaymentsByDonorId(donorId: string, mode: AppMode): Promise<Payment[]> {
    if (!this.isConfigured) return this.fallbackProvider.getPaymentsByDonorId(donorId, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('payments')
        .select('*')
        .eq('donor_id', donorId)
        .eq('mode', mode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapPaymentFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPaymentsByDonorId error:', err);
      return this.fallbackProvider.getPaymentsByDonorId(donorId, mode);
    }
  }

  async getPendingPayments(mode: AppMode): Promise<Payment[]> {
    if (!this.isConfigured) return this.fallbackProvider.getPendingPayments(mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('payments')
        .select('*')
        .eq('mode', mode)
        .in('status', ['DUE', 'PENDING', 'PARTIALLY_PAID'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapPaymentFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPendingPayments error:', err);
      return this.fallbackProvider.getPendingPayments(mode);
    }
  }

  async getNextReceiptNumber(mode: AppMode): Promise<{ formatted: string; numeric: number }> {
    if (!this.isConfigured) return this.fallbackProvider.getNextReceiptNumber(mode);

    try {
      const client = this.getClient();
      const { data, error } = await client.rpc('get_next_receipt_number_atomic', { p_mode: mode });

      if (!error && data && data.numeric) {
        return {
          numeric: Number(data.numeric),
          formatted: String(data.formatted),
        };
      }

      // Fallback calculation
      const settings = await this.getSettings();
      const prefix = settings.receiptPrefix || '';
      const startNum = settings.startingReceiptNumber || 1;

      const { data: maxPayment } = await client
        .from('payments')
        .select('numeric_receipt_number')
        .eq('mode', mode)
        .order('numeric_receipt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastNum = maxPayment?.numeric_receipt_number || startNum - 1;
      const nextNum = Math.max(lastNum, startNum - 1) + 1;
      const formatted = `${prefix}${String(nextNum).padStart(6, '0')}`;

      return { formatted, numeric: nextNum };
    } catch (err) {
      console.error('[SupabaseStorageProvider] getNextReceiptNumber error:', err);
      return this.fallbackProvider.getNextReceiptNumber(mode);
    }
  }

  async savePayment(payment: Payment, mode: AppMode): Promise<Payment> {
    if (!this.isConfigured) return this.fallbackProvider.savePayment(payment, mode);

    try {
      const client = this.getClient();
      const isDue = payment.status === 'DUE' || payment.status === 'PENDING';
      const amountVal = isDue ? payment.expectedAmount : payment.receivedAmount;

      let finalDonorId = payment.donorId || null;
      if (finalDonorId) {
        const { data: donorRow } = await client
          .from('donors')
          .select('id')
          .eq('id', finalDonorId)
          .maybeSingle();

        if (!donorRow) {
          const newDonor = {
            id: finalDonorId,
            name: payment.donorName.trim(),
            mobile: payment.donorMobile ? payment.donorMobile.replace(/\D/g, '') : '',
            address: payment.donorAddress?.trim() || '',
            total_contributed: 0,
            pavti_count: 0,
            mode: mode,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          const { error: insertDonorErr } = await client.from('donors').insert(newDonor);
          if (insertDonorErr) {
            console.warn('[SupabaseStorageProvider] Could not insert missing donor, setting donor_id to null:', insertDonorErr);
            finalDonorId = null;
          }
        }
      }

      const payload = {
        id: payment.id,
        receipt_number: payment.receiptNumber || null,
        numeric_receipt_number: payment.numericReceiptNumber || null,
        donor_id: finalDonorId,
        donor_name: payment.donorName.trim(),
        donor_mobile: payment.donorMobile?.trim() || '',
        donor_address: payment.donorAddress?.trim() || '',
        expected_amount: payment.expectedAmount || 0,
        received_amount: payment.receivedAmount || 0,
        remaining_amount: Math.max(0, (payment.expectedAmount || 0) - (payment.receivedAmount || 0)),
        status: payment.status,
        payment_method: payment.paymentMethod,
        transaction_reference: payment.transactionReference?.trim() || '',
        date: payment.date || new Date().toISOString().split('T')[0],
        host_id: payment.hostId || null,
        host_name: payment.hostName || '',
        notes: payment.notes?.trim() || '',
        mode: mode,
        updated_at: new Date().toISOString(),
      };

      const { data: savedPaymentRow, error: paymentError } = await client
        .from('payments')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Auto-sync Pavti Record
      const pavtiPayload = {
        id: `pavti-${payment.id.replace('pay-', '')}`,
        receipt_number: payment.receiptNumber || '',
        numeric_receipt_number: payment.numericReceiptNumber || null,
        payment_id: payment.id,
        donor_id: payment.donorId || null,
        donor_name: payment.donorName.trim(),
        donor_mobile: payment.donorMobile?.trim() || '',
        donor_address: payment.donorAddress?.trim() || '',
        amount: amountVal,
        amount_in_words_marathi: numberToWordsMarathi(amountVal),
        amount_in_words_english: numberToWordsEnglish(amountVal),
        payment_method: payment.paymentMethod,
        status: isDue ? 'DUE' : 'PAID',
        transaction_reference: payment.transactionReference || '',
        date: payment.date || new Date().toISOString().split('T')[0],
        host_name: payment.hostName || '',
        mode: mode,
        generated_at: new Date().toISOString(),
      };

      await client.from('pavtis').upsert(pavtiPayload, { onConflict: 'id' });

      if (payment.donorId) {
        await this.syncDonorStats(payment.donorId, mode);
      }

      return this.mapPaymentFromDb(savedPaymentRow);
    } catch (err) {
      console.error('[SupabaseStorageProvider] savePayment error:', err);
      return this.fallbackProvider.savePayment(payment, mode);
    }
  }

  async updatePendingPayment(
    paymentId: string,
    data: {
      donorName?: string;
      donorMobile?: string;
      donorAddress?: string;
      expectedAmount?: number;
      notes?: string;
      date?: string;
    },
    mode: AppMode
  ): Promise<Payment> {
    if (!this.isConfigured) return this.fallbackProvider.updatePendingPayment(paymentId, data, mode);

    try {
      const client = this.getClient();
      const existing = await this.getPaymentById(paymentId, mode);
      if (!existing) throw new Error(`Payment with ID ${paymentId} not found.`);
      if (existing.status === 'PAID') throw new Error('Paid payments cannot be modified via pending editor.');

      const updatedExpected = data.expectedAmount !== undefined ? data.expectedAmount : existing.expectedAmount;
      const updatedRemaining = Math.max(0, updatedExpected - (existing.receivedAmount || 0));

      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.donorName !== undefined) updates.donor_name = data.donorName.trim();
      if (data.donorMobile !== undefined) updates.donor_mobile = data.donorMobile.trim();
      if (data.donorAddress !== undefined) updates.donor_address = data.donorAddress.trim();
      if (data.expectedAmount !== undefined) {
        updates.expected_amount = updatedExpected;
        updates.remaining_amount = updatedRemaining;
      }
      if (data.notes !== undefined) updates.notes = data.notes.trim();
      if (data.date !== undefined) updates.date = data.date;

      const { data: updatedRow, error } = await client
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .eq('mode', mode)
        .select()
        .single();

      if (error) throw error;

      const pavtiUpdates: any = {};
      if (data.donorName !== undefined) pavtiUpdates.donor_name = data.donorName.trim();
      if (data.donorMobile !== undefined) pavtiUpdates.donor_mobile = data.donorMobile.trim();
      if (data.donorAddress !== undefined) pavtiUpdates.donor_address = data.donorAddress.trim();
      if (data.expectedAmount !== undefined) {
        pavtiUpdates.amount = updatedExpected;
        pavtiUpdates.amount_in_words_marathi = numberToWordsMarathi(updatedExpected);
        pavtiUpdates.amount_in_words_english = numberToWordsEnglish(updatedExpected);
      }
      if (data.date !== undefined) pavtiUpdates.date = data.date;

      if (Object.keys(pavtiUpdates).length > 0) {
        await client.from('pavtis').update(pavtiUpdates).eq('payment_id', paymentId);
      }

      if (existing.donorId) {
        const donorUpdates: any = { updated_at: new Date().toISOString() };
        if (data.donorName) donorUpdates.name = data.donorName.trim();
        if (data.donorMobile !== undefined) donorUpdates.mobile = data.donorMobile.trim();
        if (data.donorAddress !== undefined) donorUpdates.address = data.donorAddress.trim();
        await client.from('donors').update(donorUpdates).eq('id', existing.donorId);
      }

      return this.mapPaymentFromDb(updatedRow);
    } catch (err) {
      console.error('[SupabaseStorageProvider] updatePendingPayment error:', err);
      return this.fallbackProvider.updatePendingPayment(paymentId, data, mode);
    }
  }

  async cancelPendingPayment(paymentId: string, mode: AppMode): Promise<Payment> {
    if (!this.isConfigured) return this.fallbackProvider.cancelPendingPayment(paymentId, mode);

    try {
      const client = this.getClient();
      const existing = await this.getPaymentById(paymentId, mode);
      if (!existing) throw new Error(`Payment with ID ${paymentId} not found.`);

      const { data: updatedRow, error } = await client
        .from('payments')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('mode', mode)
        .select()
        .single();

      if (error) throw error;

      await this.addAuditLog({
        userId: existing.hostId || 'system',
        userName: existing.hostName || 'Host',
        userRole: 'HOST',
        action: 'PAYMENT_CANCELLED',
        entityType: 'PAYMENT',
        entityId: existing.id,
        details: `Pending payment for ${existing.donorName} (₹${existing.expectedAmount}) was cancelled.`,
        mode,
      });

      return this.mapPaymentFromDb(updatedRow);
    } catch (err) {
      console.error('[SupabaseStorageProvider] cancelPendingPayment error:', err);
      return this.fallbackProvider.cancelPendingPayment(paymentId, mode);
    }
  }

  async deletePayment(
    id: string,
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<{ success: boolean; deletedPayment: Payment }> {
    if (!this.isConfigured) return this.fallbackProvider.deletePayment(id, mode, user);

    try {
      const client = this.getClient();
      const existing = await this.getPaymentById(id, mode);
      if (!existing) throw new Error('पावती / देणगी नोंद सापडली नाही.');

      // Delete pavti first then payment
      await client.from('pavtis').delete().eq('payment_id', id);
      const { error } = await client.from('payments').delete().eq('id', id).eq('mode', mode);
      if (error) throw error;

      if (existing.donorId) {
        await this.syncDonorStats(existing.donorId, mode);
      }

      await this.addAuditLog({
        userId: user?.userId || 'system',
        userName: user?.userName || 'Admin',
        userRole: user?.userRole || 'HOST',
        action: 'PAYMENT_DELETED',
        entityType: 'PAYMENT',
        entityId: id,
        details: `Payment #${existing.receiptNumber || id} for ${existing.donorName} (₹${existing.receivedAmount || existing.expectedAmount}) was permanently deleted.`,
        mode,
      });

      return { success: true, deletedPayment: existing };
    } catch (err) {
      console.error('[SupabaseStorageProvider] deletePayment error:', err);
      return this.fallbackProvider.deletePayment(id, mode, user);
    }
  }

  async markPaymentAsPaid(
    paymentId: string,
    paymentDetails: {
      receivedAmount: number;
      paymentMethod: 'CASH' | 'UPI';
      transactionReference?: string;
      notes?: string;
      paymentDate?: string;
      hostId: string;
      hostName: string;
    },
    mode: AppMode
  ): Promise<{ payment: Payment; pavti: Pavti }> {
    if (!this.isConfigured) return this.fallbackProvider.markPaymentAsPaid(paymentId, paymentDetails, mode);

    try {
      const client = this.getClient();
      const existing = await this.getPaymentById(paymentId, mode);
      if (!existing) throw new Error(`Payment with ID ${paymentId} not found.`);

      const receiptNumber = existing.receiptNumber || (await this.getNextReceiptNumber(mode)).formatted;
      const paymentDate = paymentDetails.paymentDate || new Date().toISOString().split('T')[0];
      const mergedNotes = paymentDetails.notes
        ? existing.notes
          ? `${existing.notes} | ${paymentDetails.notes}`
          : paymentDetails.notes
        : existing.notes || '';

      const { data: updatedPaymentRow, error: paymentError } = await client
        .from('payments')
        .update({
          status: 'PAID',
          received_amount: paymentDetails.receivedAmount,
          remaining_amount: Math.max(0, existing.expectedAmount - paymentDetails.receivedAmount),
          payment_method: paymentDetails.paymentMethod,
          transaction_reference: paymentDetails.transactionReference || '',
          host_id: paymentDetails.hostId,
          host_name: paymentDetails.hostName,
          notes: mergedNotes,
          date: paymentDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
        .eq('mode', mode)
        .select()
        .single();

      if (paymentError) throw paymentError;

      const pavtiPayload = {
        id: `pavti-${paymentId.replace('pay-', '')}`,
        receipt_number: receiptNumber,
        numeric_receipt_number: existing.numericReceiptNumber || null,
        payment_id: paymentId,
        donor_id: existing.donorId || null,
        donor_name: existing.donorName,
        donor_mobile: existing.donorMobile || '',
        donor_address: existing.donorAddress || '',
        amount: paymentDetails.receivedAmount,
        amount_in_words_marathi: numberToWordsMarathi(paymentDetails.receivedAmount),
        amount_in_words_english: numberToWordsEnglish(paymentDetails.receivedAmount),
        payment_method: paymentDetails.paymentMethod,
        status: 'PAID',
        transaction_reference: paymentDetails.transactionReference || '',
        date: paymentDate,
        host_name: paymentDetails.hostName,
        mode: mode,
        generated_at: new Date().toISOString(),
      };

      const { data: updatedPavtiRow, error: pavtiError } = await client
        .from('pavtis')
        .upsert(pavtiPayload, { onConflict: 'id' })
        .select()
        .single();

      if (pavtiError) throw pavtiError;

      if (existing.donorId) {
        await this.syncDonorStats(existing.donorId, mode);
      }

      await this.addAuditLog({
        userId: paymentDetails.hostId,
        userName: paymentDetails.hostName,
        userRole: 'HOST',
        action: 'PAYMENT_MARKED_PAID',
        entityType: 'PAYMENT',
        entityId: paymentId,
        details: `Payment marked PAID for ${existing.donorName}. Pavti #${receiptNumber} (₹${paymentDetails.receivedAmount}, ${paymentDetails.paymentMethod}) updated.`,
        mode,
      });

      return {
        payment: this.mapPaymentFromDb(updatedPaymentRow),
        pavti: this.mapPavtiFromDb(updatedPavtiRow),
      };
    } catch (err) {
      console.error('[SupabaseStorageProvider] markPaymentAsPaid error:', err);
      return this.fallbackProvider.markPaymentAsPaid(paymentId, paymentDetails, mode);
    }
  }

  // ============================================================================
  // PAVTIS
  // ============================================================================
  async getPavtis(mode: AppMode): Promise<Pavti[]> {
    if (!this.isConfigured) return this.fallbackProvider.getPavtis(mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('pavtis')
        .select('*')
        .eq('mode', mode)
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(this.mapPavtiFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPavtis error:', err);
      return this.fallbackProvider.getPavtis(mode);
    }
  }

  async getPavtiById(id: string, mode: AppMode): Promise<Pavti | null> {
    if (!this.isConfigured) return this.fallbackProvider.getPavtiById(id, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('pavtis')
        .select('*')
        .eq('id', id)
        .eq('mode', mode)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapPavtiFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPavtiById error:', err);
      return this.fallbackProvider.getPavtiById(id, mode);
    }
  }

  async getPavtiByReceiptNumber(receiptNumber: string, mode: AppMode): Promise<Pavti | null> {
    if (!this.isConfigured) return this.fallbackProvider.getPavtiByReceiptNumber(receiptNumber, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('pavtis')
        .select('*')
        .eq('receipt_number', receiptNumber)
        .eq('mode', mode)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapPavtiFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPavtiByReceiptNumber error:', err);
      return this.fallbackProvider.getPavtiByReceiptNumber(receiptNumber, mode);
    }
  }

  async getPavtiByPaymentId(paymentId: string, mode: AppMode): Promise<Pavti | null> {
    if (!this.isConfigured) return this.fallbackProvider.getPavtiByPaymentId(paymentId, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('pavtis')
        .select('*')
        .eq('payment_id', paymentId)
        .eq('mode', mode)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapPavtiFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getPavtiByPaymentId error:', err);
      return this.fallbackProvider.getPavtiByPaymentId(paymentId, mode);
    }
  }

  async savePavti(pavti: Pavti, mode: AppMode): Promise<Pavti> {
    if (!this.isConfigured) return this.fallbackProvider.savePavti(pavti, mode);

    try {
      const client = this.getClient();
      const payload = {
        id: pavti.id,
        receipt_number: pavti.receiptNumber,
        numeric_receipt_number: pavti.numericReceiptNumber || null,
        payment_id: pavti.paymentId,
        donor_id: pavti.donorId || null,
        donor_name: pavti.donorName,
        donor_mobile: pavti.donorMobile || '',
        donor_address: pavti.donorAddress || '',
        amount: pavti.amount,
        amount_in_words_marathi: pavti.amountInWordsMarathi || '',
        amount_in_words_english: pavti.amountInWordsEnglish || '',
        payment_method: pavti.paymentMethod,
        status: pavti.status || 'PAID',
        transaction_reference: pavti.transactionReference || '',
        date: pavti.date,
        host_name: pavti.hostName || '',
        mode: mode,
        image_file_id: pavti.imageFileId || null,
        generated_at: pavti.generatedAt || new Date().toISOString(),
      };

      const { data, error } = await client
        .from('pavtis')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return this.mapPavtiFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] savePavti error:', err);
      return this.fallbackProvider.savePavti(pavti, mode);
    }
  }

  // ============================================================================
  // EXPENSES (निधी व खर्च व्यवस्थापन)
  // ============================================================================
  async getExpenses(mode: AppMode, filterDate?: string): Promise<Expense[]> {
    if (!this.isConfigured) return this.fallbackProvider.getExpenses(mode, filterDate);

    try {
      const client = this.getClient();
      let query = client
        .from('expenses')
        .select('*')
        .eq('mode', mode)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterDate) {
        const cleanFilter = filterDate.includes('T') ? filterDate.split('T')[0] : filterDate;
        query = query.eq('date', cleanFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[SupabaseStorageProvider] getExpenses error (falling back):', error.message);
        return this.fallbackProvider.getExpenses(mode, filterDate);
      }
      return (data || []).map(this.mapExpenseFromDb);
    } catch (err) {
      console.warn('[SupabaseStorageProvider] getExpenses fallback error:', err);
      return this.fallbackProvider.getExpenses(mode, filterDate);
    }
  }

  async getExpenseById(id: string, mode: AppMode): Promise<Expense | null> {
    if (!this.isConfigured) return this.fallbackProvider.getExpenseById(id, mode);

    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('mode', mode)
        .maybeSingle();

      if (error) {
        console.warn('[SupabaseStorageProvider] getExpenseById error (falling back):', error.message);
        return this.fallbackProvider.getExpenseById(id, mode);
      }
      return data ? this.mapExpenseFromDb(data) : null;
    } catch (err) {
      console.warn('[SupabaseStorageProvider] getExpenseById fallback error:', err);
      return this.fallbackProvider.getExpenseById(id, mode);
    }
  }

  async saveExpense(expense: Expense, mode: AppMode): Promise<Expense> {
    if (!this.isConfigured) return this.fallbackProvider.saveExpense(expense, mode);

    try {
      const client = this.getClient();

      // Check / assign numeric expense number
      let numericExpenseNumber = expense.numericExpenseNumber;
      let expenseNumber = expense.expenseNumber;

      if (!numericExpenseNumber) {
        const { data: maxRows } = await client
          .from('expenses')
          .select('numeric_expense_number')
          .eq('mode', mode)
          .order('numeric_expense_number', { ascending: false })
          .limit(1);

        const maxNum = maxRows && maxRows.length > 0 && maxRows[0].numeric_expense_number
          ? Number(maxRows[0].numeric_expense_number)
          : 0;

        numericExpenseNumber = maxNum + 1;
        expenseNumber = `EXP-${String(numericExpenseNumber).padStart(3, '0')}`;
      } else if (!expenseNumber) {
        expenseNumber = `EXP-${String(numericExpenseNumber).padStart(3, '0')}`;
      }

      const payload = {
        id: expense.id,
        expense_number: expenseNumber,
        numeric_expense_number: numericExpenseNumber,
        date: expense.date,
        spent_for: expense.spentFor,
        description: expense.description || '',
        amount: Number(expense.amount || 0),
        vendor_person: expense.vendorPerson || '',
        note: expense.note || '',
        added_by: expense.addedBy,
        added_by_id: expense.addedById || null,
        user_role: expense.userRole || 'HOST',
        mode: mode,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('expenses')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.warn('[SupabaseStorageProvider] saveExpense error (falling back):', error.message);
        return this.fallbackProvider.saveExpense(expense, mode);
      }

      await this.addAuditLog({
        userId: expense.addedById || 'user-admin',
        userName: expense.addedBy || 'Admin',
        userRole: expense.userRole || 'HOST',
        action: 'EXPENSE_ADDED',
        entityType: 'EXPENSE',
        entityId: expense.id,
        details: `खर्च नोंद: ${expenseNumber} (${expense.spentFor} - ₹${expense.amount}) दिनांक ${expense.date} नोंदवण्यात आला.`,
        mode,
      });

      return this.mapExpenseFromDb(data);
    } catch (err) {
      console.warn('[SupabaseStorageProvider] saveExpense fallback error:', err);
      return this.fallbackProvider.saveExpense(expense, mode);
    }
  }

  async updateExpense(
    id: string,
    data: {
      date?: string;
      spentFor?: string;
      description?: string;
      amount?: number;
      vendorPerson?: string;
      note?: string;
    },
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<Expense> {
    if (!this.isConfigured) return this.fallbackProvider.updateExpense(id, data, mode, user);

    try {
      const client = this.getClient();
      const existing = await this.getExpenseById(id, mode);
      if (!existing) throw new Error('खर्च नोंद सापडली नाही.');

      const payload = {
        date: data.date ?? existing.date,
        spent_for: data.spentFor ?? existing.spentFor,
        description: data.description !== undefined ? data.description : existing.description || '',
        amount: data.amount !== undefined ? Number(data.amount) : existing.amount,
        vendor_person: data.vendorPerson !== undefined ? data.vendorPerson : existing.vendorPerson || '',
        note: data.note !== undefined ? data.note : existing.note || '',
        updated_at: new Date().toISOString(),
      };

      const { data: updatedRow, error } = await client
        .from('expenses')
        .update(payload)
        .eq('id', id)
        .eq('mode', mode)
        .select()
        .single();

      if (error) {
        console.warn('[SupabaseStorageProvider] updateExpense error (falling back):', error.message);
        return this.fallbackProvider.updateExpense(id, data, mode, user);
      }

      await this.addAuditLog({
        userId: user?.userId || 'user-admin',
        userName: user?.userName || 'Admin',
        userRole: user?.userRole || 'HOST',
        action: 'EXPENSE_UPDATED',
        entityType: 'EXPENSE',
        entityId: id,
        details: `खर्च बदल: ${existing.expenseNumber} (${payload.spent_for} - ₹${payload.amount}) दिनांक ${payload.date}.`,
        mode,
      });

      return this.mapExpenseFromDb(updatedRow);
    } catch (err) {
      console.warn('[SupabaseStorageProvider] updateExpense fallback error:', err);
      return this.fallbackProvider.updateExpense(id, data, mode, user);
    }
  }

  async deleteExpense(
    id: string,
    mode: AppMode,
    user?: { userId: string; userName: string; userRole: UserRole }
  ): Promise<{ success: boolean; deletedExpense: Expense }> {
    if (!this.isConfigured) return this.fallbackProvider.deleteExpense(id, mode, user);

    try {
      const client = this.getClient();
      const existing = await this.getExpenseById(id, mode);
      if (!existing) throw new Error('खर्च नोंद सापडली नाही.');

      const { error } = await client.from('expenses').delete().eq('id', id).eq('mode', mode);
      if (error) {
        console.warn('[SupabaseStorageProvider] deleteExpense error (falling back):', error.message);
        return this.fallbackProvider.deleteExpense(id, mode, user);
      }

      await this.addAuditLog({
        userId: user?.userId || 'user-admin',
        userName: user?.userName || 'Admin',
        userRole: user?.userRole || 'HOST',
        action: 'EXPENSE_DELETED',
        entityType: 'EXPENSE',
        entityId: id,
        details: `खर्च हटवला: ${existing.expenseNumber || id} (${existing.spentFor} - ₹${existing.amount}) दिनांक ${existing.date}.`,
        mode,
      });

      return { success: true, deletedExpense: existing };
    } catch (err) {
      console.warn('[SupabaseStorageProvider] deleteExpense fallback error:', err);
      return this.fallbackProvider.deleteExpense(id, mode, user);
    }
  }

  async getExpenseSummary(mode: AppMode, targetDate?: string): Promise<ExpenseSummary> {
    if (!this.isConfigured) return this.fallbackProvider.getExpenseSummary(mode, targetDate);

    try {
      const expenses = await this.getExpenses(mode);

      const formatYYYYMMDD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const formatDDMMYYYY = (dateStr: string) => {
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          const [y, m, d] = clean.split('-');
          return `${d}/${m}/${y}`;
        }
        return clean;
      };

      const normalizeDateStr = (dateStr?: string): string => {
        if (!dateStr) return formatYYYYMMDD(new Date());
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
          const [d, m, y] = clean.split('/');
          return `${y}-${m}-${d}`;
        }
        return clean;
      };

      const now = new Date();
      const todayStr = targetDate ? normalizeDateStr(targetDate) : formatYYYYMMDD(now);
      const baseDate = targetDate ? new Date(`${todayStr}T12:00:00.000Z`) : now;

      const yesterday = new Date(baseDate);
      yesterday.setDate(baseDate.getDate() - 1);
      const yesterdayStr = formatYYYYMMDD(yesterday);

      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);

      let totalExpense = 0;
      let todayExpense = 0;
      let yesterdayExpense = 0;
      let thisMonthExpense = 0;

      const dailyMap: Record<string, DailyExpenseRecord> = {};

      for (const exp of expenses) {
        const normDate = normalizeDateStr(exp.date);
        const amt = Number(exp.amount) || 0;
        totalExpense += amt;

        if (!dailyMap[normDate]) {
          dailyMap[normDate] = {
            date: normDate,
            formattedDate: formatDDMMYYYY(normDate),
            totalExpense: 0,
            expenseCount: 0,
          };
        }
        dailyMap[normDate].totalExpense += amt;
        dailyMap[normDate].expenseCount++;

        if (normDate === todayStr) {
          todayExpense += amt;
        }
        if (normDate === yesterdayStr) {
          yesterdayExpense += amt;
        }
        const expDateObj = new Date(normDate);
        if (!isNaN(expDateObj.getTime()) && expDateObj >= monthAgo) {
          thisMonthExpense += amt;
        }
      }

      const dailyHistory = Object.values(dailyMap).sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      return {
        todayExpense,
        totalExpense,
        yesterdayExpense,
        thisMonthExpense,
        mode,
        dailyHistory,
      };
    } catch (err) {
      console.warn('[SupabaseStorageProvider] getExpenseSummary fallback error:', err);
      return this.fallbackProvider.getExpenseSummary(mode, targetDate);
    }
  }

  // ============================================================================
  // ANNOUNCEMENTS
  // ============================================================================
  async getAnnouncements(onlyActive = false): Promise<Announcement[]> {
    if (!this.isConfigured) return this.fallbackProvider.getAnnouncements(onlyActive);

    try {
      const client = this.getClient();
      let query = client.from('announcements').select('*').order('created_at', { ascending: false });
      if (onlyActive) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(this.mapAnnouncementFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getAnnouncements error:', err);
      return this.fallbackProvider.getAnnouncements(onlyActive);
    }
  }

  async getAnnouncementById(id: string): Promise<Announcement | null> {
    if (!this.isConfigured) return this.fallbackProvider.getAnnouncementById(id);

    try {
      const client = this.getClient();
      const { data, error } = await client.from('announcements').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? this.mapAnnouncementFromDb(data) : null;
    } catch (err) {
      console.error('[SupabaseStorageProvider] getAnnouncementById error:', err);
      return this.fallbackProvider.getAnnouncementById(id);
    }
  }

  async saveAnnouncement(announcement: Announcement): Promise<Announcement> {
    if (!this.isConfigured) return this.fallbackProvider.saveAnnouncement(announcement);

    try {
      const client = this.getClient();
      const payload = {
        id: announcement.id,
        title_marathi: announcement.titleMarathi,
        title_english: announcement.titleEnglish || '',
        content_marathi: announcement.contentMarathi,
        content_english: announcement.contentEnglish || '',
        date: announcement.date,
        time: announcement.time || '',
        active: announcement.active ?? true,
        status: announcement.status || 'PUBLISHED',
        priority: announcement.priority || 'NORMAL',
        event_date: announcement.eventDate || null,
        venue: announcement.venue || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await client
        .from('announcements')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return this.mapAnnouncementFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] saveAnnouncement error:', err);
      return this.fallbackProvider.saveAnnouncement(announcement);
    }
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    if (!this.isConfigured) return this.fallbackProvider.deleteAnnouncement(id);

    try {
      const client = this.getClient();
      const { error } = await client.from('announcements').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[SupabaseStorageProvider] deleteAnnouncement error:', err);
      return this.fallbackProvider.deleteAnnouncement(id);
    }
  }

  // ============================================================================
  // AUDIT LOGS
  // ============================================================================
  async getAuditLogs(mode?: AppMode, limit = 100): Promise<AuditLog[]> {
    if (!this.isConfigured) return this.fallbackProvider.getAuditLogs(mode, limit);

    try {
      const client = this.getClient();
      let query = client
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (mode) {
        query = query.eq('mode', mode);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(this.mapAuditLogFromDb);
    } catch (err) {
      console.error('[SupabaseStorageProvider] getAuditLogs error:', err);
      return this.fallbackProvider.getAuditLogs(mode, limit);
    }
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    if (!this.isConfigured) return this.fallbackProvider.addAuditLog(log);

    try {
      const client = this.getClient();
      const newLogId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const timestamp = new Date().toISOString();

      const payload = {
        id: newLogId,
        user_id: log.userId,
        username: log.userName,
        user_role: log.userRole,
        action: log.action,
        entity_type: log.entityType || null,
        entity_id: log.entityId || null,
        details: log.details,
        mode: log.mode,
        ip_address: log.ipAddress || null,
        timestamp: timestamp,
      };

      const { data, error } = await client.from('audit_logs').insert(payload).select().single();
      if (error) throw error;
      return this.mapAuditLogFromDb(data);
    } catch (err) {
      console.error('[SupabaseStorageProvider] addAuditLog error:', err);
      return this.fallbackProvider.addAuditLog(log);
    }
  }

  // ============================================================================
  // ANALYTICS & SUMMARY
  // ============================================================================
  async getCollectionSummary(mode: AppMode, targetDate?: string): Promise<CollectionSummary> {
    if (!this.isConfigured) return this.fallbackProvider.getCollectionSummary(mode, targetDate);

    try {
      const payments = await this.getPayments(mode);

      const formatYYYYMMDD = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const formatDDMMYYYY = (dateStr: string) => {
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          const [y, m, d] = clean.split('-');
          return `${d}/${m}/${y}`;
        }
        return clean;
      };

      const normalizeDateStr = (dateStr?: string): string => {
        if (!dateStr) return formatYYYYMMDD(new Date());
        const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
          const [d, m, y] = clean.split('/');
          return `${y}-${m}-${d}`;
        }
        return clean;
      };

      const now = new Date();
      const todayStr = targetDate ? normalizeDateStr(targetDate) : formatYYYYMMDD(now);
      const baseDate = targetDate ? new Date(`${todayStr}T12:00:00.000Z`) : now;

      const yesterday = new Date(baseDate);
      yesterday.setDate(baseDate.getDate() - 1);
      const yesterdayStr = formatYYYYMMDD(yesterday);

      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);

      const currentYear = now.getFullYear();

      let totalCollection = 0;
      let paidPavtisCount = 0;
      let cashCollection = 0;
      let upiCollection = 0;
      let otherCollection = 0;

      const dailyMap: Record<
        string,
        {
          date: string;
          formattedDate: string;
          cashCollection: number;
          upiCollection: number;
          totalCollection: number;
          receiptCount: number;
        }
      > = {};

      const addCollectionToMap = (
        pDate: string,
        amt: number,
        method: 'CASH' | 'UPI' | 'DUE' | string
      ) => {
        if (amt <= 0) return;
        const normalizedDate = normalizeDateStr(pDate);

        if (!dailyMap[normalizedDate]) {
          dailyMap[normalizedDate] = {
            date: normalizedDate,
            formattedDate: formatDDMMYYYY(normalizedDate),
            cashCollection: 0,
            upiCollection: 0,
            totalCollection: 0,
            receiptCount: 0,
          };
        }

        if (method === 'CASH') {
          dailyMap[normalizedDate].cashCollection += amt;
          cashCollection += amt;
        } else if (method === 'UPI') {
          dailyMap[normalizedDate].upiCollection += amt;
          upiCollection += amt;
        } else {
          dailyMap[normalizedDate].cashCollection += amt;
          otherCollection += amt;
        }

        dailyMap[normalizedDate].totalCollection += amt;
        dailyMap[normalizedDate].receiptCount++;
        totalCollection += amt;
        paidPavtisCount++;
      };

      for (const payment of payments) {
        if (payment.installments && payment.installments.length > 0) {
          for (const inst of payment.installments) {
            addCollectionToMap(inst.date, inst.amount, inst.paymentMethod);
          }
        } else if (
          (payment.status === 'PAID' || payment.status === 'PARTIALLY_PAID') &&
          (payment.receivedAmount || 0) > 0
        ) {
          addCollectionToMap(payment.date, payment.receivedAmount, payment.paymentMethod);
        }
      }

      const todayRecord = dailyMap[todayStr];
      const todayCollection = todayRecord ? todayRecord.totalCollection : 0;

      const yesterdayRecord = dailyMap[yesterdayStr];
      const yesterdayCollection = yesterdayRecord ? yesterdayRecord.totalCollection : 0;

      let thisWeekCollection = 0;
      let thisMonthCollection = 0;
      let currentYearCollection = 0;

      for (const [dStr, record] of Object.entries(dailyMap)) {
        const dObj = new Date(dStr);
        if (!isNaN(dObj.getTime())) {
          if (dObj >= weekAgo) thisWeekCollection += record.totalCollection;
          if (dObj >= monthAgo) thisMonthCollection += record.totalCollection;
          if (dObj.getFullYear() === currentYear) currentYearCollection += record.totalCollection;
        }
      }

      const dailyHistory = Object.values(dailyMap).sort((a, b) =>
        b.date.localeCompare(a.date)
      );

      const pendingPayments = payments.filter(
        (p) => p.status === 'DUE' || p.status === 'PENDING' || p.status === 'PARTIALLY_PAID'
      );
      const pendingAmount = pendingPayments.reduce(
        (sum, p) => sum + (p.expectedAmount - (p.receivedAmount || 0)),
        0
      );
      const partiallyPaidAmount = pendingPayments
        .filter((p) => p.status === 'PARTIALLY_PAID')
        .reduce((sum, p) => sum + (p.receivedAmount || 0), 0);

      return {
        totalCollection,
        todayCollection,
        yesterdayCollection,
        thisWeekCollection,
        thisMonthCollection,
        currentYearCollection,
        paidPavtisCount,
        pendingAmount,
        pendingDonorsCount: pendingPayments.length,
        partiallyPaidAmount,
        cashCollection,
        upiCollection,
        otherCollection,
        mode,
        dailyHistory,
      };
    } catch (err) {
      console.error('[SupabaseStorageProvider] getCollectionSummary error:', err);
      return this.fallbackProvider.getCollectionSummary(mode);
    }
  }

  // ============================================================================
  // DATA RESET & BACKUP
  // ============================================================================
  // --- Data Reset Operations ---
  async clearTestData(): Promise<{ deletedPayments: number; deletedDonors: number; deletedPavtis: number; deletedExpenses: number }> {
    if (!this.isConfigured) return this.fallbackProvider.clearTestData();

    try {
      const client = this.getClient();
      const [{ count: deletedPayments }, { count: deletedDonors }, { count: deletedPavtis }, { count: deletedExpenses }] =
        await Promise.all([
          client.from('payments').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
          client.from('donors').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
          client.from('pavtis').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
          client.from('expenses').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
        ]);

      // Sequential deletion to respect foreign keys
      await client.from('pavtis').delete().eq('mode', 'TEST');
      await client.from('payments').delete().eq('mode', 'TEST');
      await client.from('donors').delete().eq('mode', 'TEST');
      await client.from('expenses').delete().eq('mode', 'TEST');
      await client.from('audit_logs').delete().eq('mode', 'TEST');
      await client.from('receipt_counters').upsert({ mode: 'TEST', last_number: 0, updated_at: new Date().toISOString() });

      await this.addAuditLog({
        userId: 'user-admin-1',
        userName: 'Super Admin',
        userRole: 'SUPER_ADMIN',
        action: 'CLEAR_TEST_DATA',
        entityType: 'SYSTEM',
        details: `Cleared all test data (${deletedPayments || 0} payments, ${deletedDonors || 0} donors, ${deletedPavtis || 0} pavtis, ${deletedExpenses || 0} expenses). Live data untouched.`,
        mode: 'TEST',
      });

      return {
        deletedPayments: deletedPayments || 0,
        deletedDonors: deletedDonors || 0,
        deletedPavtis: deletedPavtis || 0,
        deletedExpenses: deletedExpenses || 0,
      };
    } catch (err) {
      console.error('[SupabaseStorageProvider] clearTestData error:', err);
      return this.fallbackProvider.clearTestData();
    }
  }

  async resetAllData(
    confirmation: string,
    mode: AppMode,
    user: { userId: string; userName: string; userRole: UserRole }
  ): Promise<boolean> {
    if (user.userRole !== 'SUPER_ADMIN') {
      throw new Error('अनधिकृत: फक्त सुपर ॲडमिन संपूर्ण डेटा रीसेट करू शकतात.');
    }

    const clean = (confirmation || '').trim().toUpperCase();
    if (clean !== 'RESET' && clean !== 'DELETE ALL DATA') {
      throw new Error('अवैध पुष्टीकरण: कृपया अचूक "RESET" टाईप करा.');
    }

    if (!this.isConfigured) return this.fallbackProvider.resetAllData(confirmation, mode, user);

    try {
      const client = this.getClient();

      // Sequential deletion to respect foreign keys
      const { error: pavtisErr } = await client.from('pavtis').delete().eq('mode', mode);
      if (pavtisErr) console.error('pavtis delete err:', pavtisErr);

      const { error: paymentsErr } = await client.from('payments').delete().eq('mode', mode);
      if (paymentsErr) console.error('payments delete err:', paymentsErr);

      const { error: donorsErr } = await client.from('donors').delete().eq('mode', mode);
      if (donorsErr) console.error('donors delete err:', donorsErr);

      const { error: expensesErr } = await client.from('expenses').delete().eq('mode', mode);
      if (expensesErr) console.error('expenses delete err:', expensesErr);

      await client.from('receipt_counters').upsert({ mode: mode, last_number: 0, updated_at: new Date().toISOString() });

      await this.addAuditLog({
        userId: user.userId,
        userName: user.userName,
        userRole: user.userRole,
        action: 'DATA_RESET',
        entityType: 'SYSTEM',
        details: `Full ${mode} database reset performed by ${user.userName}.`,
        mode: mode,
      });

      return true;
    } catch (err) {
      console.error('[SupabaseStorageProvider] resetAllData error:', err);
      return this.fallbackProvider.resetAllData(confirmation, mode, user);
    }
  }

  async exportBackup(): Promise<DatabaseBackup> {
    if (!this.isConfigured) return this.fallbackProvider.exportBackup();

    try {
      const [settings, users, announcements, liveDonors, testDonors, livePayments, testPayments, livePavtis, testPavtis, liveExpenses, testExpenses, liveLogs, testLogs] =
        await Promise.all([
          this.getSettings(),
          this.getUsers(),
          this.getAnnouncements(),
          this.getDonors('LIVE'),
          this.getDonors('TEST'),
          this.getPayments('LIVE'),
          this.getPayments('TEST'),
          this.getPavtis('LIVE'),
          this.getPavtis('TEST'),
          this.getExpenses('LIVE'),
          this.getExpenses('TEST'),
          this.getAuditLogs('LIVE', 1000),
          this.getAuditLogs('TEST', 1000),
        ]);

      return {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings,
        users,
        announcements,
        liveData: {
          donors: liveDonors,
          payments: livePayments,
          pavtis: livePavtis,
          expenses: liveExpenses,
          auditLogs: liveLogs,
        },
        testData: {
          donors: testDonors,
          payments: testPayments,
          pavtis: testPavtis,
          expenses: testExpenses,
          auditLogs: testLogs,
        },
      };
    } catch (err) {
      console.error('[SupabaseStorageProvider] exportBackup error:', err);
      return this.fallbackProvider.exportBackup();
    }
  }

  async importBackup(backupData: DatabaseBackup): Promise<boolean> {
    if (!backupData.settings || !backupData.users || !backupData.liveData) {
      throw new Error('Invalid backup file format.');
    }

    if (!this.isConfigured) return this.fallbackProvider.importBackup(backupData);

    try {
      const client = this.getClient();
      await this.saveSettings(backupData.settings);

      for (const u of backupData.users) {
        await this.saveUser(u);
      }

      if (backupData.announcements) {
        for (const a of backupData.announcements) {
          await this.saveAnnouncement(a);
        }
      }

      for (const d of backupData.liveData.donors || []) {
        await this.saveDonor(d, 'LIVE');
      }
      for (const p of backupData.liveData.payments || []) {
        await this.savePayment(p, 'LIVE');
      }
      for (const pav of backupData.liveData.pavtis || []) {
        await this.savePavti(pav, 'LIVE');
      }
      for (const exp of backupData.liveData.expenses || []) {
        await this.saveExpense(exp, 'LIVE');
      }

      for (const d of backupData.testData?.donors || []) {
        await this.saveDonor(d, 'TEST');
      }
      for (const p of backupData.testData?.payments || []) {
        await this.savePayment(p, 'TEST');
      }
      for (const pav of backupData.testData?.pavtis || []) {
        await this.savePavti(pav, 'TEST');
      }
      for (const exp of backupData.testData?.expenses || []) {
        await this.saveExpense(exp, 'TEST');
      }

      const maxLiveNumber = (backupData.liveData.payments || [])
        .filter((p) => p.numericReceiptNumber)
        .reduce((max, p) => Math.max(max, p.numericReceiptNumber || 0), 0);

      await client
        .from('receipt_counters')
        .upsert({ mode: 'LIVE', last_number: maxLiveNumber, updated_at: new Date().toISOString() });

      return true;
    } catch (err) {
      console.error('[SupabaseStorageProvider] importBackup error:', err);
      return this.fallbackProvider.importBackup(backupData);
    }
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================
  private async syncDonorStats(donorId: string, mode: AppMode): Promise<void> {
    try {
      const client = this.getClient();
      const { data: paidPayments } = await client
        .from('payments')
        .select('received_amount, date')
        .eq('donor_id', donorId)
        .eq('mode', mode)
        .eq('status', 'PAID')
        .order('date', { ascending: false });

      const total = (paidPayments || []).reduce((sum, p) => sum + Number(p.received_amount || 0), 0);
      const count = (paidPayments || []).length;
      const lastDate = paidPayments && paidPayments.length > 0 ? paidPayments[0].date : null;

      await client
        .from('donors')
        .update({
          total_contributed: total,
          pavti_count: count,
          last_payment_date: lastDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', donorId)
        .eq('mode', mode);
    } catch (err) {
      console.error('[SupabaseStorageProvider] syncDonorStats error:', err);
    }
  }

  private mapSettingsFromDb(row: any): MandalSettings {
    return {
      id: row.id,
      mandalNameMarathi: row.mandal_name_marathi || '',
      mandalNameEnglish: row.mandal_name_english || '',
      regNumber: row.reg_number || '',
      locationMarathi: row.location_marathi || '',
      locationEnglish: row.location_english || '',
      addressMarathi: row.address_marathi || '',
      addressEnglish: row.address_english || '',
      contactNumber: row.contact_number || '',
      alternateContact: row.alternate_contact || '',
      whatsappGroupLink: row.whatsapp_group_link || '',
      year: row.year || '२०२६',
      logoUrl: row.logo_url || undefined,
      taglineMarathi: row.tagline_marathi || '',
      sloganMarathi: row.slogan_marathi || '',
      receiptPrefix: row.receipt_prefix || '',
      startingReceiptNumber: Number(row.starting_receipt_number || 1),
      enablePartialPayments: Boolean(row.enable_partial_payments),
      enableWhatsAppGroupInvite: Boolean(row.enable_whatsapp_group_invite),
      designations: Array.isArray(row.designations) ? row.designations : [],
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      phone: row.phone || undefined,
      active: Boolean(row.active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapDonorFromDb(row: any): Donor {
    return {
      id: row.id,
      name: row.name,
      mobile: row.mobile || '',
      address: row.address || '',
      totalContributed: Number(row.total_contributed || 0),
      pavtiCount: Number(row.pavti_count || 0),
      lastPaymentDate: row.last_payment_date || undefined,
      mode: row.mode as AppMode,
      notes: row.notes || undefined,
      isArchived: Boolean(row.is_archived),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPaymentFromDb(row: any): Payment {
    return {
      id: row.id,
      receiptNumber: row.receipt_number || undefined,
      numericReceiptNumber: row.numeric_receipt_number ? Number(row.numeric_receipt_number) : undefined,
      donorId: row.donor_id || '',
      donorName: row.donor_name,
      donorMobile: row.donor_mobile || '',
      donorAddress: row.donor_address || undefined,
      expectedAmount: Number(row.expected_amount || 0),
      receivedAmount: Number(row.received_amount || 0),
      remainingAmount: Number(row.remaining_amount || 0),
      status: row.status,
      paymentMethod: row.payment_method,
      transactionReference: row.transaction_reference || undefined,
      date: row.date,
      hostId: row.host_id || '',
      hostName: row.host_name || '',
      notes: row.notes || undefined,
      mode: row.mode as AppMode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPavtiFromDb(row: any): Pavti {
    return {
      id: row.id,
      receiptNumber: row.receipt_number,
      numericReceiptNumber: row.numeric_receipt_number ? Number(row.numeric_receipt_number) : undefined,
      paymentId: row.payment_id,
      donorId: row.donor_id || '',
      donorName: row.donor_name,
      donorMobile: row.donor_mobile || '',
      donorAddress: row.donor_address || undefined,
      amount: Number(row.amount || 0),
      amountInWordsMarathi: row.amount_in_words_marathi || '',
      amountInWordsEnglish: row.amount_in_words_english || '',
      paymentMethod: row.payment_method,
      status: row.status,
      transactionReference: row.transaction_reference || undefined,
      date: row.date,
      hostName: row.host_name || '',
      mode: row.mode as AppMode,
      imageFileId: row.image_file_id || undefined,
      generatedAt: row.generated_at,
    };
  }

  private mapAnnouncementFromDb(row: any): Announcement {
    return {
      id: row.id,
      titleMarathi: row.title_marathi,
      titleEnglish: row.title_english || undefined,
      contentMarathi: row.content_marathi,
      contentEnglish: row.content_english || undefined,
      date: row.date,
      time: row.time || undefined,
      active: Boolean(row.active),
      status: row.status,
      priority: row.priority,
      eventDate: row.event_date || undefined,
      venue: row.venue || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAuditLogFromDb(row: any): AuditLog {
    return {
      id: row.id,
      userId: row.user_id || '',
      userName: row.username || row.user_name || '',
      userRole: row.user_role as UserRole,
      action: row.action,
      entityType: row.entity_type || undefined,
      entityId: row.entity_id || undefined,
      details: row.details || '',
      mode: row.mode as AppMode,
      ipAddress: row.ip_address || undefined,
      timestamp: row.timestamp,
    };
  }

  private mapExpenseFromDb(row: any): Expense {
    return {
      id: row.id,
      expenseNumber: row.expense_number || undefined,
      numericExpenseNumber: row.numeric_expense_number ? Number(row.numeric_expense_number) : undefined,
      date: row.date,
      spentFor: row.spent_for,
      description: row.description || undefined,
      amount: Number(row.amount || 0),
      vendorPerson: row.vendor_person || undefined,
      note: row.note || undefined,
      addedBy: row.added_by || 'Admin',
      addedById: row.added_by_id || undefined,
      userRole: row.user_role as UserRole || 'HOST',
      mode: row.mode as AppMode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
