import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { theme } from '../../src/theme/theme';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n/I18nContext';
import { getSecureItem } from '../../src/storage/secureStorage';
import { APP_CONFIG } from '../../src/config/app.config';
import { getCurrentMetierConfig } from '../../src/config/metiers.config';
import { getCategories } from '../../src/api/products';

function buildTakeposUrl(serverUrl: string): string {
  try {
    const u = new URL(serverUrl);
    return `${u.origin}${u.pathname.replace(/\/$/, '')}/takepos/index.php?idmenu=31&mainmenu=takepos&leftmenu=`;
  } catch {
    return `${serverUrl.replace(/\/$/, '')}/takepos/index.php?idmenu=31&mainmenu=takepos&leftmenu=`;
  }
}

export default function SettingsScreen() {
  const { serverUrl, userLogin, logout } = useAuth();
  const { t, language, setLanguage, languages } = useI18n();
  const metier = getCurrentMetierConfig();
  const [authTokenPresent, setAuthTokenPresent] = useState<boolean | null>(null);
  const [categoriesCount, setCategoriesCount] = useState<number | null>(null);

  const takeposWebUrl = useMemo(() => {
    if (!serverUrl) return null;
    return buildTakeposUrl(serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    (async () => {
      const token = await getSecureItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      setAuthTokenPresent(!!token);
    })().catch(() => setAuthTokenPresent(null));
  }, [serverUrl, userLogin, metier.id]);

  const handleOpenTakeposWeb = async () => {
    if (!takeposWebUrl) {
      Alert.alert(t('settings.title'), t('alerts.connectionError'));
      return;
    }
    await Linking.openURL(takeposWebUrl);
  };

  const handleTestCategories = async () => {
    try {
      setCategoriesCount(null);
      const cats = await getCategories();
      setCategoriesCount(cats.length);
      Alert.alert('API', `${t('settings.categories')}: ${cats.length}`);
    } catch (e: any) {
      const status = e?.response?.status;
      Alert.alert('API', status === 401 ? '401: Token/API key refusé (droits ou header auth).' : t('alerts.connectionError'));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <Text style={styles.subtitle}>{t('settings.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.language')}</Text>
        <View style={styles.languageContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                language === lang.code && styles.languageButtonActive,
              ]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageText,
                  language === lang.code && styles.languageTextActive,
                ]}
              >
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.connection')}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.server')}</Text>
          <Text style={styles.value} numberOfLines={2}>{serverUrl || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.user')}</Text>
          <Text style={styles.value}>{userLogin || '—'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.tokenPresent')}</Text>
          <Text style={styles.value}>
            {authTokenPresent === null ? '—' : authTokenPresent ? t('common.yes') : t('common.no')}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.business')}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.profile')}</Text>
          <Text style={styles.value}>{metier.label}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.tables')}</Text>
          <Text style={styles.value}>
            {metier.options.activerTables ? t('settings.activated') : t('settings.deactivated')}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.apiDolibarr')}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t('settings.categories')}</Text>
          <Text style={styles.value}>{categoriesCount === null ? '—' : String(categoriesCount)}</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handleTestCategories}>
          <Text style={styles.primaryButtonText}>{t('settings.testCategories')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.takeposWeb')}</Text>
        <Text style={styles.helpText}>
          {t('settings.takeposWebDescription')}
        </Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenTakeposWeb} disabled={!takeposWebUrl}>
          <Text style={styles.secondaryButtonText}>{t('settings.openTakepos')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.posConfig')}</Text>
        <Text style={styles.helpText}>
          {t('settings.posConfigDescription')}
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => {
          router.push('/(app)/pos-config');
        }}>
          <Text style={styles.primaryButtonText}>{t('settings.posConfigButton')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('settings.actions')}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(pos)')}>
          <Text style={styles.secondaryButtonText}>{t('settings.backToPos')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Text style={styles.dangerButtonText}>{t('auth.logoutButton')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.h1,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    gap: theme.spacing.md,
  },
  label: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  value: {
    ...theme.typography.bodySmall,
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  helpText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  dangerButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
  languageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
    minWidth: 120,
  },
  languageButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  languageFlag: {
    fontSize: 24,
  },
  languageText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  languageTextActive: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

