// Language utility functions for React app
interface LanguageUtils {
  getCurrentLanguage(): string;
  setLanguage(lang: string): void;
  syncLanguageWithServer(lang: string): Promise<void>;
  initLanguageFromServer(): Promise<string>;
  applyTranslations(): void;
}

class LanguageUtilsClass implements LanguageUtils {
  getCurrentLanguage(): string {
    return localStorage.getItem('appLanguage') || 'en';
  }
  
  setLanguage(lang: string): void {
    localStorage.setItem('appLanguage', lang);
    // Sync with server
    this.syncLanguageWithServer(lang);
  }
  
  // Sync language preference with server
  async syncLanguageWithServer(lang: string): Promise<void> {
    try {
      await fetch('/api/set-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ language: lang })
      });
    } catch (error) {
      console.warn('Failed to sync language with server:', error);
    }
  }
  
  // Get language from server on page load
  async initLanguageFromServer(): Promise<string> {
    try {
      const response = await fetch('/api/get-language');
      const data = await response.json();
      if (data.language) {
        localStorage.setItem('appLanguage', data.language);
        return data.language;
      }
      return this.getCurrentLanguage();
    } catch (error) {
      console.warn('Failed to get language from server:', error);
      return this.getCurrentLanguage();
    }
  }
  
  // Apply translations to elements with data-lang attributes
  applyTranslations(): void {
    const currentLang = this.getCurrentLanguage();
    
    // Update all elements with language attributes
    document.querySelectorAll('[data-lang-en]').forEach(element => {
      const enText = element.getAttribute('data-lang-en');
      const idText = element.getAttribute('data-lang-id');
      
      if (currentLang === 'en' && enText) {
        element.textContent = enText;
      } else if (currentLang === 'id' && idText) {
        element.textContent = idText;
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-lang-en-placeholder]').forEach(element => {
      const enPlaceholder = element.getAttribute('data-lang-en-placeholder');
      const idPlaceholder = element.getAttribute('data-lang-id-placeholder');
      
      if (currentLang === 'en' && enPlaceholder) {
        (element as HTMLInputElement).placeholder = enPlaceholder;
      } else if (currentLang === 'id' && idPlaceholder) {
        (element as HTMLInputElement).placeholder = idPlaceholder;
      }
    });
  }
}

// Export singleton instance
export const LanguageUtils = new LanguageUtilsClass();

/**
 * Updates the header title based on the current screen
 */
export const updateHeaderTitle = (screenName: string): void => {
  const headerTitle = document.getElementById('headerTitle');
  if (headerTitle) {
    headerTitle.textContent = screenName;
  }
};

/**
 * Format time in MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Generate a random room ID
 */
export const generateRoomId = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Validate room ID format (6 digits)
 */
export const isValidRoomId = (roomId: string): boolean => {
  return /^\d{6}$/.test(roomId);
};
