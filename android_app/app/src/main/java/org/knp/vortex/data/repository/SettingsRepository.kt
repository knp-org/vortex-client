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

    fun getServerUrl(): String {
        return prefs.getString(KEY_SERVER_URL, DEFAULT_URL) ?: DEFAULT_URL
    }

    fun setServerUrl(url: String) {
        val normalizedUrl = url.trim().removeSuffix("/")
        prefs.edit().putString(KEY_SERVER_URL, normalizedUrl).apply()
        _serverUrl.value = normalizedUrl
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

    fun getDefaultUrl(): String = DEFAULT_URL
}
