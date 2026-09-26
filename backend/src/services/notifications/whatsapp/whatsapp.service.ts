export class WhatsappService {
  static async sendWhatsappMessage(phoneNumber: string, message: string) {
    console.log(`[System Notification] To: ${phoneNumber}, Message: ${message}`);
    return { success: true, isMock: true, message: 'Notification sent successfully.', whatsappError: null as string | null };
  }
}
