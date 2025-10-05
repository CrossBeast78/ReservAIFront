class SessionStorageManager {
  static keys = {
    accessToken: "access_token",
    emailSenderToken: "email_sender_token",
    authorizationToken: "authorization_token",
    accountType: "account_type",
    accountName: "account_name"
  };

  static setItem(key, value) {
    sessionStorage.setItem(key, value);
  }

  static getItem(key) {
    return sessionStorage.getItem(key);
  }

  static removeItem(key) {
    sessionStorage.removeItem(key);
  }

  static saveSession({ access_token, email_sender_token, authorization_token, account_type, account_name }) {
    if (access_token) this.setItem(this.keys.accessToken, access_token);
    if (email_sender_token) this.setItem(this.keys.emailSenderToken, email_sender_token);
    if (authorization_token) this.setItem(this.keys.authorizationToken, authorization_token);
    if (account_type) this.setItem(this.keys.accountType, account_type);
    if (account_name) this.setItem(this.keys.accountName, account_name);
  }

  static getSession() {
    return {
      access_token: this.getItem(this.keys.accessToken),
      email_sender_token: this.getItem(this.keys.emailSenderToken),
      authorization_token: this.getItem(this.keys.authorizationToken),
      account_type: this.getItem(this.keys.accountType),
      account_name: this.getItem(this.keys.accountName),
    };
  }

  static clearSession() {
    Object.values(this.keys).forEach(key => sessionStorage.removeItem(key));
  }
}

export default SessionStorageManager;
