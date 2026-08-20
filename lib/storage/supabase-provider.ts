import {
  User,
  MandalSettings,
  Donor,
  Payment,
  Pavti,
  Announcement,
  AuditLog,
  AppMode,
  CollectionSummary,
  UserRole,
} from '@/types';
import { IStorageProvider, DatabaseBackup } from './types';
import { LocalStorageProvider } from './local-provider';
import { getSupabaseServerClient, isSupabaseServerConfigured } from '@/lib/supabase/server';
import { numberToWordsMarathi, numberToWordsEnglish } from '@/lib/utils/number-to-words';

export class SupabaseStorageProvider implements IStorageProvider {
  name = 'SupabaseStorageProvider';
  private fallbackProvider: LocalStorageProvider;
  private isConfigured = false;

  constructor() {
    this.fallbackProvider = new LocalStorageProvider();
    this.isConfigured = isSupabaseServerConfigured;
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
      // Check if donor has financial records
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
      // Use atomic PostgreSQL stored function if available
      const { data, error } = await client.rpc('get_next_receipt_number_atomic', { p_mode: mode });

      if (!error && data && data.numeric) {
        return {
          numeric: Number(data.numeric),
          formatted: String(data.formatted),
        };
      }

      // Fallback calculation directly in Supabase
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

      const payload = {
        id: payment.id,
        receipt_number: payment.receiptNumber || null,
        numeric_receipt_number: payment.numericReceiptNumber || null,
        donor_id: payment.donorId || null,
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

      await client.from('pavtis').upsert(pavtiPayload, { onConflict: 'payment_id' });

      // Update Donor summary stats if donorId is linked
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

      // Update associated Pavti record
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

      // Update linked donor
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

      // Delete payment (cascades to pavti via foreign key)
      const { error } = await client.from('payments').delete().eq('id', id).eq('mode', mode);
      if (error) throw error;

      // Sync donor stats
      if (existing.donorId) {
        await this.syncDonorStats(existing.donorId, mode);
      }

      // Add audit log
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
        .upsert(pavtiPayload, { onConflict: 'payment_id' })
        .select()
        .single();

      if (pavtiError) throw pavtiError;

      // Sync donor stats
      if (existing.donorId) {
        await this.syncDonorStats(existing.donorId, mode);
      }

      // Add audit log
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
  async getCollectionSummary(mode: AppMode): Promise<CollectionSummary> {
    if (!this.isConfigured) return this.fallbackProvider.getCollectionSummary(mode);

    try {
      const payments = await this.getPayments(mode);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);

      const monthAgo = new Date(now);
      monthAgo.setDate(now.getDate() - 30);

      const currentYear = now.getFullYear();

      let totalCollection = 0;
      let todayCollection = 0;
      let yesterdayCollection = 0;
      let thisWeekCollection = 0;
      let thisMonthCollection = 0;
      let currentYearCollection = 0;
      let paidPavtisCount = 0;
      let cashCollection = 0;
      let upiCollection = 0;
      let otherCollection = 0;

      for (const payment of payments) {
        if (payment.status === 'PAID') {
          const amt = payment.receivedAmount || 0;
          totalCollection += amt;
          paidPavtisCount++;

          if (payment.paymentMethod === 'CASH') cashCollection += amt;
          else if (payment.paymentMethod === 'UPI') upiCollection += amt;
          else otherCollection += amt;

          const pDate = new Date(payment.date);
          const pDateStr = payment.date;

          if (pDateStr === todayStr) todayCollection += amt;
          if (pDateStr === yesterdayStr) yesterdayCollection += amt;
          if (pDate >= weekAgo) thisWeekCollection += amt;
          if (pDate >= monthAgo) thisMonthCollection += amt;
          if (pDate.getFullYear() === currentYear) currentYearCollection += amt;
        }
      }

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
      };
    } catch (err) {
      console.error('[SupabaseStorageProvider] getCollectionSummary error:', err);
      return this.fallbackProvider.getCollectionSummary(mode);
    }
  }

  // ============================================================================
  // DATA RESET & BACKUP
  // ============================================================================
  async clearTestData(): Promise<{ deletedPayments: number; deletedDonors: number; deletedPavtis: number }> {
    if (!this.isConfigured) return this.fallbackProvider.clearTestData();

    try {
      const client = this.getClient();
      const [{ count: deletedPayments }, { count: deletedDonors }, { count: deletedPavtis }] =
        await Promise.all([
          client.from('payments').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
          client.from('donors').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
          client.from('pavtis').select('id', { count: 'exact', head: true }).eq('mode', 'TEST'),
        ]);

      await Promise.all([
        client.from('pavtis').delete().eq('mode', 'TEST'),
        client.from('payments').delete().eq('mode', 'TEST'),
        client.from('donors').delete().eq('mode', 'TEST'),
        client.from('audit_logs').delete().eq('mode', 'TEST'),
        client.from('receipt_counters').upsert({ mode: 'TEST', last_number: 0, updated_at: new Date().toISOString() }),
      ]);

      await this.addAuditLog({
        userId: 'user-admin-1',
        userName: 'Super Admin',
        userRole: 'SUPER_ADMIN',
        action: 'CLEAR_TEST_DATA',
        entityType: 'SYSTEM',
        details: `Cleared all test data (${deletedPayments || 0} payments, ${deletedDonors || 0} donors, ${deletedPavtis || 0} pavtis). Live data untouched.`,
        mode: 'TEST',
      });

      return {
        deletedPayments: deletedPayments || 0,
        deletedDonors: deletedDonors || 0,
        deletedPavtis: deletedPavtis || 0,
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
    if (confirmation !== 'RESET' && confirmation !== 'DELETE ALL DATA') {
      throw new Error('अवैध पुष्टीकरण: कृपया अचूक "DELETE ALL DATA" टाईप करा.');
    }

    if (!this.isConfigured) return this.fallbackProvider.resetAllData(confirmation, mode, user);

    try {
      const client = this.getClient();
      await Promise.all([
        client.from('pavtis').delete().eq('mode', mode),
        client.from('payments').delete().eq('mode', mode),
        client.from('donors').delete().eq('mode', mode),
        client.from('receipt_counters').upsert({ mode: mode, last_number: 0, updated_at: new Date().toISOString() }),
      ]);

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
      const [settings, users, announcements, liveDonors, testDonors, livePayments, testPayments, livePavtis, testPavtis, liveLogs, testLogs] =
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
          auditLogs: liveLogs,
        },
        testData: {
          donors: testDonors,
          payments: testPayments,
          pavtis: testPavtis,
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
      // Save settings
      await this.saveSettings(backupData.settings);

      // Save users
      for (const u of backupData.users) {
        await this.saveUser(u);
      }

      // Save announcements
      if (backupData.announcements) {
        for (const a of backupData.announcements) {
          await this.saveAnnouncement(a);
        }
      }

      // Restore Live Data
      for (const d of backupData.liveData.donors || []) {
        await this.saveDonor(d, 'LIVE');
      }
      for (const p of backupData.liveData.payments || []) {
        await this.savePayment(p, 'LIVE');
      }
      for (const pav of backupData.liveData.pavtis || []) {
        await this.savePavti(pav, 'LIVE');
      }

      // Restore Test Data
      for (const d of backupData.testData?.donors || []) {
        await this.saveDonor(d, 'TEST');
      }
      for (const p of backupData.testData?.payments || []) {
        await this.savePayment(p, 'TEST');
      }
      for (const pav of backupData.testData?.pavtis || []) {
        await this.savePavti(pav, 'TEST');
      }

      // Update counters
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
}
