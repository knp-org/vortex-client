package org.knp.vortex.data.repository

import android.content.Context
import android.content.SharedPreferences
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private const val PREFS_NAME = "media_server_settings"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_BIOMETRIC_ENABLED = "biometric_enabled"
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_USERNAME = "username"
        private const val KEY_SAVED_URLS = "saved_urls"
        private const val DEFAULT_URL = "http://127.0.0.1:3000"
    }

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    
    private val _serverUrl = MutableStateFlow(getServerUrl())
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _authToken = MutableStateFlow(getAuthToken())
    val authToken: StateFlow<String?> = _authToken.asStateFlow()

    private val _isBiometricEnabled = MutableStateFlow(isBiometricEnabled())
    val biometricEnabled: StateFlow<Boolean> = _isBiometricEnabled.asStateFlow()

    private val _username = MutableStateFlow(getUsername())
    val username: StateFlow<String?> = _username.asStateFlow()

    private val _savedUrls = MutableStateFlow(getSavedUrlsFromPrefs())
    val savedUrls: StateFlow<List<String>> = _savedUrls.asStateFlow()

    private fun getSavedUrlsFromPrefs(): List<String> {
        return prefs.getStringSet(KEY_SAVED_URLS, setOf(DEFAULT_URL))?.toList() ?: listOf(DEFAULT_URL)
    }

    fun addSavedUrl(url: String) {
        var normalizedUrl = url.trim().removeSuffix("/")
        if (normalizedUrl.isNotEmpty() && !normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
            normalizedUrl = "http://$normalizedUrl"
        }
        val currentSet = prefs.getStringSet(KEY_SAVED_URLS, setOf(DEFAULT_URL)) ?: setOf(DEFAULT_URL)
        val newSet = currentSet.toMutableSet().apply { add(normalizedUrl) }
        prefs.edit().putStringSet(KEY_SAVED_URLS, newSet).apply()
        _savedUrls.value = newSet.toList()
    }

    fun getServerUrl(): String {
        return prefs.getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
    }

    fun setServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url).apply()
        _serverUrl.value = url
    }

    /**
     * Ensures the URL has an http:// or https:// scheme.
     * Call this only at save / connect time, NOT on every keystroke.
     */
    fun normalizeUrl(url: String): String {
        val trimmed = url.trim().removeSuffix("/")
        if (trimmed.isEmpty()) return trimmed
        return if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
            "http://$trimmed"
        } else {
            trimmed
        }
    }

    fun isBiometricEnabled(): Boolean {
        return prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)
    }

    fun setBiometricEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(KEY_BIOMETRIC_ENABLED, enabled).apply()
        _isBiometricEnabled.value = enabled
    }

    fun getAuthToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    fun setAuthToken(token: String?) {
        prefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
        _authToken.value = token
    }

    fun getUsername(): String? {
        return prefs.getString(KEY_USERNAME, null)
    }

    fun setUsername(username: String?) {
        prefs.edit().putString(KEY_USERNAME, username).apply()
        _username.value = username
    }

    fun getReadingStyle(seriesIdentifier: String): String {
        return prefs.getString("reading_style_$seriesIdentifier", "HORIZONTAL_LTR") ?: "HORIZONTAL_LTR"
    }

    fun setReadingStyle(seriesIdentifier: String, style: String) {
        prefs.edit().putString("reading_style_$seriesIdentifier", style).apply()
    }

    fun getDefaultUrl(): String = DEFAULT_URL
}
