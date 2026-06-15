export interface NotificationProvider {
  send(to: string, message: string, metadata?: any): Promise<boolean>;
}

export class EmailProvider implements NotificationProvider {
  async send(to: string, message: string, metadata?: any): Promise<boolean> {
    console.log(`[EmailProvider] Sending to ${to}...`);
    console.log(`[EmailProvider] Message: ${message}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return true;
  }
}

export class SMSProvider implements NotificationProvider {
  async send(to: string, message: string, metadata?: any): Promise<boolean> {
    console.log(`[SMSProvider] Sending to ${to}...`);
    console.log(`[SMSProvider] Message: ${message}`);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return true;
  }
}

// A simple factory or unified dispatcher can be used by the executor
export class NotificationProviderFactory {
  static getProvider(actionType: string): NotificationProvider {
    // Determine channel based on action severity/type
    if (actionType === "URGENT_WINBACK_OFFER") {
      return new SMSProvider();
    }
    return new EmailProvider();
  }
}
